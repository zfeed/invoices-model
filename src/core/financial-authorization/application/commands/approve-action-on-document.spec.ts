import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { InMemoryDomainEvents } from '../../../../infrastructure/domain-events/in-memory-domain-events';
import { Session } from '../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { Approver } from '../../domain/approver/approver';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template';
import { FinancialDocument } from '../../domain/document/document';
import { DocumentApprovedEvent } from '../../domain/document/events/document-approved.event';
import { GroupTemplate } from '../../domain/groups/group-template';
import { Money } from '../../domain/money/money';
import { Name } from '../../domain/name/name';
import { Email } from '../../domain/email/email';
import { Order } from '../../domain/order/order';
import { Range } from '../../domain/range/range';
import { StepTemplate } from '../../domain/step/step-template';
import { InvoiceIssuedEvent } from '../../../invoices/domain/invoice/events/invoice-issued.event';
import { CreateAuthflowPolicy } from './create-authflow-policy';
import { OnInvoiceIssued } from '../event-handlers/on-invoice-issued';
import { ApproveActionOnDocument } from './approve-action-on-document';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database';

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
    let domainEvents: InMemoryDomainEvents;
    let command: ApproveActionOnDocument;
    let approver: ReturnType<typeof createTemplate>['approver'];

    beforeEach(async () => {
        await cleanDatabase();

        const fixtures = createTemplate();
        approver = fixtures.approver;

        domainEvents = new InMemoryDomainEvents();
        session = new Session(new PersistentManager(domainEvents));

        const createPolicy = new CreateAuthflowPolicy(session);
        await createPolicy.execute({
            action: 'pay',
            templates: [fixtures.template],
        });

        const onInvoiceIssuedHandler = new OnInvoiceIssued(
            session,
            domainEvents
        );
        await onInvoiceIssuedHandler.register();
        await domainEvents.publishEvents({
            events: [new InvoiceIssuedEvent(INVOICE_DATA)],
        });

        command = new ApproveActionOnDocument(session);
    });

    it('should throw when document is not found', async () => {
        await expect(
            command.execute({
                referenceId: 'non-existing',
                action: 'pay',
                approver,
            })
        ).rejects.toMatchObject({
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
        });
    });

    it('should approve an action on a document', async () => {
        const document = await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        const authflow = document.authflows.find((a) => a.action === 'pay');

        expect(authflow?.isApproved).toBe(true);
    });

    it('should persist the approved document', async () => {
        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
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
        await domainEvents.subscribeToEvent(
            DocumentApprovedEvent,
            async (e) => {
                approvedEvents.push(e);
            }
        );

        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
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
                approver,
            })
        ).rejects.toMatchObject({
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
        });
    });

    it('should throw when approving already approved action', async () => {
        await command.execute({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        await expect(
            command.execute({
                referenceId: 'invoice-123',
                action: 'pay',
                approver,
            })
        ).rejects.toThrow();
    });
});
