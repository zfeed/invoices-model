import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { InMemoryDocumentStorage } from '../../../../../infrastructure/storage/in-memory.document-storage';
import { InMemoryPolicyStorage } from '../../../../../infrastructure/storage/in-memory.policy-storage';
import { createApprover } from '../../../domain/approver/approver';
import { createAuthflowTemplate } from '../../../domain/authflow/authflow-template';
import { DocumentApprovedEvent } from '../../../domain/document/events/document-approved.event';
import { createGroupTemplate } from '../../../domain/groups/group-template';
import { createMoney } from '../../../domain/money/money';
import { createRange } from '../../../domain/range/range';
import { createStepTemplate } from '../../../domain/step/step-template';
import { InvoiceIssuedEvent } from '../../../../invoices/domain/invoice/events/invoice-issued.event';
import { createAuthflowPolicyCommand } from './create-authflow-policy';
import { onInvoiceIssued } from '../event-handlers/on-invoice-issued';
import { approveActionOnDocumentCommand } from './approve-action-on-document';

const approver = createApprover({
    name: 'John Doe',
    email: 'john@example.com',
}).unwrap();

const range = (from: string, to: string) =>
    createRange(
        createMoney(from, 'USD').unwrap(),
        createMoney(to, 'USD').unwrap()
    ).unwrap();

const groupTemplate = createGroupTemplate({
    approvers: [approver],
}).unwrap();

const stepTemplate = createStepTemplate({
    order: 0,
    groups: [groupTemplate],
}).unwrap();

const template = createAuthflowTemplate({
    range: range('0', '10000'),
    steps: [stepTemplate],
}).unwrap();

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
    let documentStorage: InMemoryDocumentStorage;
    let policyStorage: InMemoryPolicyStorage;
    let domainEvents: InMemoryDomainEvents;
    let command: ReturnType<typeof approveActionOnDocumentCommand>;

    beforeEach(async () => {
        documentStorage = new InMemoryDocumentStorage();
        policyStorage = new InMemoryPolicyStorage();
        domainEvents = new InMemoryDomainEvents();

        const createPolicy = createAuthflowPolicyCommand(
            policyStorage,
            domainEvents
        );
        await createPolicy({
            action: 'pay',
            templates: [template],
        });

        await onInvoiceIssued(domainEvents, documentStorage, policyStorage);
        await domainEvents.publishEvents({
            events: [new InvoiceIssuedEvent(INVOICE_DATA)],
        });

        command = approveActionOnDocumentCommand(documentStorage, domainEvents);
    });

    it('should return error when document is not found', async () => {
        const result = await command({
            referenceId: 'non-existing',
            action: 'pay',
            approver,
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND
        );
    });

    it('should approve an action on a document', async () => {
        const result = await command({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        expect(result.isOk()).toBe(true);

        const document = result.unwrap();
        const authflow = document.authflows.find((a) => a.action === 'pay');

        expect(authflow?.isApproved).toBe(true);
    });

    it('should persist the approved document', async () => {
        await command({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        const found = await documentStorage
            .findByReferenceId('invoice-123')
            .run();

        found.fold(
            () => { throw new Error('Expected document to exist'); },
            (doc) => {
                const authflow = doc.authflows.find((a) => a.action === 'pay');
                expect(authflow?.isApproved).toBe(true);
            }
        );
    });

    it('should publish DocumentApprovedEvent', async () => {
        const approvedEvents: DocumentApprovedEvent[] = [];
        await domainEvents.subscribeToEvent(
            DocumentApprovedEvent,
            async (e) => {
                approvedEvents.push(e);
            }
        );

        await command({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        expect(approvedEvents).toHaveLength(1);
        expect(approvedEvents[0]).toBeInstanceOf(DocumentApprovedEvent);
        expect(approvedEvents[0].data.referenceId).toBe('invoice-123');
    });

    it('should return error when authflow for action is not found', async () => {
        const result = await command({
            referenceId: 'invoice-123',
            action: 'unknown-action',
            approver,
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND
        );
    });

    it('should return error when approving already approved action', async () => {
        await command({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        const result = await command({
            referenceId: 'invoice-123',
            action: 'pay',
            approver,
        });

        expect(result.isError()).toBe(true);
    });
});
