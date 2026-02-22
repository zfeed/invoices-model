import { DomainEvents } from './shared/domain-events/domain-events.interface';
import { UnitOfWorkFactory } from './invoices/application/unit-of-work/unit-of-work.interface';
import { DocumentStorage } from './financial-authorization/application/storage/document-storage.interface';
import { PolicyStorage } from './financial-authorization/application/storage/policy-storage.interface';
import { CreateDraftInvoice } from './invoices/application/use-cases/commands/create-draft-invoice/create-draft-invoice';
import { UpdateDraftInvoice } from './invoices/application/use-cases/commands/update-draft-invoice/update-draft-invoice';
import { CalculateDraftInvoice } from './invoices/application/use-cases/commands/calculate-draft-invoice/calculate-draft-invoice';
import { CompleteDraftInvoice } from './invoices/application/use-cases/commands/complete-draft-invoice/complete-draft-invoice';
import { ArchiveDraftInvoice } from './invoices/application/use-cases/commands/archive-draft-invoice/archive-draft-invoice';
import { DraftDraftInvoice } from './invoices/application/use-cases/commands/draft-draft-invoice/draft-draft-invoice';
import { ProcessInvoice } from './invoices/application/use-cases/commands/process-invoice/process-invoice';
import { CancelInvoice } from './invoices/application/use-cases/commands/cancel-invoice/cancel-invoice';
import { PayInvoice } from './invoices/application/use-cases/commands/pay-invoice/pay-invoice';
import { createAuthflowPolicyCommand } from './financial-authorization/application/use-cases/commands/create-authflow-policy';
import { approveActionOnDocumentCommand } from './financial-authorization/application/use-cases/commands/approve-action-on-document';
import { canApproverApproveQuery } from './financial-authorization/application/use-cases/queries/can-approver-approve';
import { onInvoiceIssued } from './financial-authorization/application/use-cases/event-handlers/on-invoice-issued';

type Infrastructure = {
    unitOfWorkFactory: UnitOfWorkFactory;
    domainEvents: DomainEvents;
    documentStorage: DocumentStorage;
    policyStorage: PolicyStorage;
};

export const bootstrap = async (infra: Infrastructure) => {
    await onInvoiceIssued(infra.domainEvents, infra.documentStorage, infra.policyStorage);

    return {
        createDraftInvoice: new CreateDraftInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        updateDraftInvoice: new UpdateDraftInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        calculateDraftInvoice: new CalculateDraftInvoice(),
        completeDraftInvoice: new CompleteDraftInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        archiveDraftInvoice: new ArchiveDraftInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        draftDraftInvoice: new DraftDraftInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        processInvoice: new ProcessInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        cancelInvoice: new CancelInvoice(infra.unitOfWorkFactory, infra.domainEvents),
        payInvoice: new PayInvoice(infra.unitOfWorkFactory, infra.domainEvents, infra.documentStorage),
        createAuthflowPolicy: createAuthflowPolicyCommand(infra.policyStorage, infra.domainEvents),
        approveActionOnDocument: approveActionOnDocumentCommand(infra.documentStorage, infra.domainEvents),
        canApproverApprove: canApproverApproveQuery(infra.documentStorage),
    };
};
