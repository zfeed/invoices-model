import { Session } from '../../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { CanApproverApprove } from '../../../../financial-authorization/application/queries/can-approver-approve.ts';
import { FinancialDocument } from '../../../../financial-authorization/domain/document/document.ts';
import { Authflow } from '../../../../financial-authorization/domain/authflow/authflow.ts';
import { Money } from '../../../../financial-authorization/domain/money/money.ts';
import { ReferenceId } from '../../../../financial-authorization/domain/reference-id/reference-id.ts';
import { Id as FAId } from '../../../../financial-authorization/domain/id/id.ts';
import { Name as FAName } from '../../../../financial-authorization/domain/name/name.ts';
import { Email as FAEmail } from '../../../../financial-authorization/domain/email/email.ts';
import { Action } from '../../../../financial-authorization/domain/action/action.ts';
import { Order } from '../../../../financial-authorization/domain/order/order.ts';
import { Range } from '../../../../financial-authorization/domain/range/range.ts';
import { Approver } from '../../../../financial-authorization/domain/approver/approver.ts';
import { Group } from '../../../../financial-authorization/domain/groups/group.ts';
import { Step } from '../../../../financial-authorization/domain/step/step.ts';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice.ts';
import { CompleteDraftInvoice } from '../complete-draft-invoice/complete-draft-invoice.ts';
import { ProcessInvoice } from '../process-invoice/process-invoice.ts';
import { PayInvoice } from './pay-invoice.ts';
import { InvoicePaidEvent } from '../../../domain/invoice/events/invoice-paid.event.ts';
import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient.ts';
import { cleanDatabase } from '../../../../../platform/infrastructure/persistent-manager/clean-database.ts';
import { getTestKysely } from '../../../../../../test/kysely.ts';
const kysely = getTestKysely();

const uuid = () => crypto.randomUUID();

const COMPLETE_DRAFT_REQUEST = {
    lineItems: [
        {
            description: 'Consulting',
            price: { amount: '200', currency: 'USD' },
            quantity: '1',
        },
    ],
    vatRate: '10',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    issuer: {
        type: ISSUER_TYPE.COMPANY,
        name: 'Company Inc.',
        address: '123 Main St',
        taxId: 'TAX123',
        email: 'info@company.com',
    },
    recipient: {
        type: RECIPIENT_TYPE.INDIVIDUAL,
        name: 'Jane Smith',
        address: '456 Oak Ave',
        taxId: 'TAX456',
        email: 'jane@example.com',
        taxResidenceCountry: 'US',
        billing: {
            type: 'PAYPAL' as const,
            email: 'jane@paypal.com',
        },
    },
};

const APPROVER_ID = uuid();

const createAuthorizationDocument = (referenceId: string) => {
    const approver = Approver.create({
        id: FAId.fromString(APPROVER_ID),
        name: FAName.create('Alice').unwrap(),
        email: FAEmail.create('alice@example.com').unwrap(),
    }).unwrap();

    const group = Group.create({
        requiredApprovals: 1,
        approvers: [approver],
        approvals: [],
    }).unwrap();

    const step = Step.create({
        order: Order.create(0).unwrap(),
        groups: [group],
    }).unwrap();

    const authflow = Authflow.create({
        action: Action.create('pay').unwrap(),
        range: Range.create(
            Money.create('0', 'USD').unwrap(),
            Money.create('100000', 'USD').unwrap()
        ).unwrap(),
        steps: [step],
    }).unwrap();

    return FinancialDocument.create({
        referenceId: ReferenceId.create(referenceId).unwrap(),
        value: Money.create('220', 'USD').unwrap(),
        authflows: [authflow],
    }).unwrap();
};

describe('PayInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;
    let processCommand: ProcessInvoice;
    let payCommand: PayInvoice;

    beforeEach(async () => {
        await cleanDatabase(kysely);
        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        const canApproverApprove = new CanApproverApprove(session);
        createCommand = new CreateDraftInvoice(session);
        completeCommand = new CompleteDraftInvoice(session);
        processCommand = new ProcessInvoice(session);
        payCommand = new PayInvoice(session, canApproverApprove);
    });

    it('should throw PAYMENT_NOT_AUTHORIZED when document does not exist', async () => {
        await expect(
            payCommand.execute({
                id: 'non-existing-id',
                approverId: APPROVER_ID,
            })
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
        });
    });

    it('should throw PAYMENT_NOT_AUTHORIZED when approver is not eligible', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);
        await processCommand.execute(invoice.id);

        const document = createAuthorizationDocument(invoice.id);
        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        await expect(
            payCommand.execute({
                id: invoice.id,
                approverId: uuid(),
            })
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
        });
    });

    it('should pay a processing invoice when approver is authorized', async () => {
        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);
        await processCommand.execute(invoice.id);

        const document = createAuthorizationDocument(invoice.id);
        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const result = await payCommand.execute({
            id: invoice.id,
            approverId: APPROVER_ID,
        });

        expect(result.status).toBe('PAID');
    });

    it('should publish InvoicePaidEvent', async () => {
        const paidEvents: InvoicePaidEvent[] = [];
        await domainEventsBus.subscribeToEvent(InvoicePaidEvent, async (e) => {
            paidEvents.push(e);
        });

        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);
        await processCommand.execute(invoice.id);

        const document = createAuthorizationDocument(invoice.id);
        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        await payCommand.execute({
            id: invoice.id,
            approverId: APPROVER_ID,
        });

        expect(paidEvents).toEqual([
            expect.objectContaining({
                name: 'invoice.paid',
                data: expect.objectContaining({
                    id: invoice.id,
                    status: 'PAID',
                    lineItems: expect.any(Object),
                    total: { amount: '220', currency: 'USD' },
                    vatRate: '0.1',
                    vatAmount: { amount: '20', currency: 'USD' },
                    issueDate: '2025-01-01',
                    dueDate: '2025-02-01',
                    issuer: {
                        type: 'COMPANY',
                        name: 'Company Inc.',
                        address: '123 Main St',
                        taxId: 'TAX123',
                        email: 'info@company.com',
                    },
                    recipient: {
                        type: 'INDIVIDUAL',
                        name: 'Jane Smith',
                        address: '456 Oak Ave',
                        taxId: 'TAX456',
                        email: 'jane@example.com',
                        taxResidenceCountry: 'US',
                        billing: {
                            type: 'PAYPAL',
                            data: { email: 'jane@paypal.com' },
                        },
                    },
                }),
            }),
        ]);
    });
});
