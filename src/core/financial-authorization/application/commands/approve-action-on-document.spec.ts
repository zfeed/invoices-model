import { KNOWN_ERROR_CODE } from '../../../../core/building-blocks/errors/known-error-codes.ts';
import { InMemoryDomainEventsBus } from '../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { Session } from '../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { EventOutboxStorage } from '../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { Approver } from '../../domain/approver/approver.ts';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template.ts';
import { FinancialDocument } from '../../domain/document/document.ts';
import { DocumentApprovedEvent } from '../../domain/document/events/document-approved.event.ts';
import { GroupTemplate } from '../../domain/groups/group-template.ts';
import { Money } from '../../domain/money/money.ts';
import { Name } from '../../domain/name/name.ts';
import { Email } from '../../domain/email/email.ts';
import { Id } from '../../domain/id/id.ts';
import { Order } from '../../domain/order/order.ts';
import { Range } from '../../domain/range/range.ts';
import { StepTemplate } from '../../domain/step/step-template.ts';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event.ts';
import { CreateAuthflowPolicy } from './create-authflow-policy.ts';
import { OnInvoiceIssued } from '../event-handlers/on-invoice-issued.ts';
import { ApproveActionOnDocument } from './approve-action-on-document.ts';
import { cleanDatabase } from '../../../../platform/infrastructure/persistent-manager/clean-database.ts';
import { getTestKysely } from '../../../../../test/kysely.ts';
const kysely = getTestKysely();

const range = (from: string, to: string) =>
    Range.create(
        Money.create(from, 'USD').unwrap(),
        Money.create(to, 'USD').unwrap()
    ).unwrap();

const createTemplate = () => {
    const approver = Approver.create({
        name: Name.create('John Doe').unwrap(),
        email: Email.create('john@example.com').unwrap(),
    }).unwrap();

    const groupTemplate = GroupTemplate.create({
        requiredApprovals: 1,
        approvers: [approver],
    }).unwrap();

    const stepTemplate = StepTemplate.create({
        order: Order.create(0).unwrap(),
        groups: [groupTemplate],
    }).unwrap();

    const template = AuthflowTemplate.create({
        range: range('0', '10000'),
        steps: [stepTemplate],
    }).unwrap();

    return { approver, template };
};

const INVOICE_DATA = {
    id: 'invoice-123',
    status: 'ISSUED',
    lineItems: {
        items: [
            {
                description: 'Consulting',
                price: { amount: '200', currency: 'USD' },
                quantity: '1',
                total: { amount: '200', currency: 'USD' },
            },
        ],
        subtotal: { amount: '200', currency: 'USD' },
    },
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
            type: 'PAYPAL' as const,
            data: { email: 'jane@paypal.com' },
        },
    },
};

describe('approveActionOnDocumentCommand', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let command: ApproveActionOnDocument;
    let approverId: string;

    beforeEach(async () => {
        await cleanDatabase(kysely);

        const fixtures = createTemplate();
        approverId = fixtures.approver.id.toPlain();

        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );

        const createPolicy = new CreateAuthflowPolicy(session);
        await createPolicy.execute({
            action: 'pay',
            templates: [fixtures.template],
        });

        const onInvoiceIssuedHandler = new OnInvoiceIssued(
            session,
            domainEventsBus
        );
        await onInvoiceIssuedHandler.register();
        await domainEventsBus.publishEvents({
            events: [InvoiceIssuedEvent.create(INVOICE_DATA)],
        });

        command = new ApproveActionOnDocument(session);
    });

    it('should throw when document is not found', async () => {
        await expect(
            command.execute({
                referenceId: 'non-existing',
                action: 'pay',
                approverId,
            })
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
        });
    });

    it('should approve an action on a document', async () => {
        const document = await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approverId,
        });

        const authflow = document.authflows.find((a) => a.action === 'pay');

        expect(authflow?.isApproved).toBe(true);
    });

    it('should persist the approved document', async () => {
        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approverId,
        });

        {
            await using uow = await session.begin();
            const doc = await uow
                .collection(FinancialDocument)
                .findBy('referenceId', 'invoice-123');
            const authflow = doc!.authflows.find(
                (a) => a.action.toPlain() === 'pay'
            );
            expect(authflow?.isApproved).toBe(true);
        }
    });

    it('should publish DocumentApprovedEvent', async () => {
        const approvedEvents: DocumentApprovedEvent[] = [];
        await domainEventsBus.subscribeToEvent(
            DocumentApprovedEvent,
            async (e) => {
                approvedEvents.push(e);
            }
        );

        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approverId,
        });

        expect(approvedEvents).toHaveLength(1);
        expect(approvedEvents[0]).toBeInstanceOf(DocumentApprovedEvent);
        expect(approvedEvents[0].data.referenceId).toBe('invoice-123');
    });

    it('should throw when authflow for action is not found', async () => {
        await expect(
            command.execute({
                referenceId: 'invoice-123',
                action: 'unknown-action',
                approverId,
            })
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
        });
    });

    it('should throw when approving already approved action', async () => {
        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approverId,
        });

        await expect(
            command.execute({
                referenceId: 'invoice-123',
                action: 'pay',
                approverId,
            })
        ).rejects.toThrow();
    });
});
