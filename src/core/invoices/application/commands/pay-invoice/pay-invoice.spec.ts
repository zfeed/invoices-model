import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../../infrastructure/persistent-manager/persistent-manager';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CanApproverApprove } from '../../../../financial-authorization/application/queries/can-approver-approve';
import { FinancialDocument } from '../../../../financial-authorization/domain/document/document';
import { Authflow } from '../../../../financial-authorization/domain/authflow/authflow';
import { Money } from '../../../../financial-authorization/domain/money/money';
import { ReferenceId } from '../../../../financial-authorization/domain/reference-id/reference-id';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { CompleteDraftInvoice } from '../complete-draft-invoice/complete-draft-invoice';
import { ProcessInvoice } from '../process-invoice/process-invoice';
import { PayInvoice } from './pay-invoice';
import { InvoicePaidEvent } from '../../../domain/invoice/events/invoice-paid.event';
import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient';

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

const createAuthorizationDocument = (referenceId: string) =>
    FinancialDocument.create({
        referenceId: ReferenceId.fromPlain(referenceId),
        value: Money.fromPlain({ amount: '220', currency: 'USD' }),
        authflows: [
            Authflow.fromPlain({
                id: 'authflow-1',
                action: 'pay',
                range: {
                    from: { amount: '0', currency: 'USD' },
                    to: { amount: '100000', currency: 'USD' },
                },
                steps: [
                    {
                        id: 'step-1',
                        order: 0,
                        groups: [
                            {
                                id: 'group-1',
                                requiredApprovals: 1,
                                approvers: [
                                    {
                                        id: 'approver-1',
                                        name: 'Alice',
                                        email: 'alice@example.com',
                                    },
                                ],
                                approvals: [],
                            },
                        ],
                    },
                ],
            }),
        ],
    }).unwrap();

describe('PayInvoice', () => {
    let session: Session;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let completeCommand: CompleteDraftInvoice;
    let processCommand: ProcessInvoice;
    let payCommand: PayInvoice;

    beforeEach(() => {
        domainEvents = new InMemoryDomainEvents();
        session = new Session({
            storage: new PersistentManager(domainEvents),
            maxRetries: 5,
        });
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
                approverId: 'approver-1',
            })
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
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
        }

        await expect(
            payCommand.execute({
                id: invoice.id,
                approverId: 'unauthorized-approver',
            })
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
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
        }

        const result = await payCommand.execute({
            id: invoice.id,
            approverId: 'approver-1',
        });

        expect(result.status).toBe('PAID');
    });

    it('should publish InvoicePaidEvent', async () => {
        const paidEvents: InvoicePaidEvent[] = [];
        await domainEvents.subscribeToEvent(InvoicePaidEvent, async (e) => {
            paidEvents.push(e);
        });

        const draft = await createCommand.execute(COMPLETE_DRAFT_REQUEST);
        const invoice = await completeCommand.execute(draft.id);
        await processCommand.execute(invoice.id);

        const document = createAuthorizationDocument(invoice.id);
        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
        }

        await payCommand.execute({
            id: invoice.id,
            approverId: 'approver-1',
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
