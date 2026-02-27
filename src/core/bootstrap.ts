import { DomainEvents } from './shared/domain-events/domain-events.interface';
import { Session } from './shared/unit-of-work/unit-of-work.interface';
import { CreateDraftInvoice } from './invoices/application/commands/create-draft-invoice/create-draft-invoice';
import { UpdateDraftInvoice } from './invoices/application/commands/update-draft-invoice/update-draft-invoice';
import { CalculateDraftInvoice } from './invoices/application/commands/calculate-draft-invoice/calculate-draft-invoice';
import { CompleteDraftInvoice } from './invoices/application/commands/complete-draft-invoice/complete-draft-invoice';
import { ArchiveDraftInvoice } from './invoices/application/commands/archive-draft-invoice/archive-draft-invoice';
import { DraftDraftInvoice } from './invoices/application/commands/draft-draft-invoice/draft-draft-invoice';
import { ProcessInvoice } from './invoices/application/commands/process-invoice/process-invoice';
import { CancelInvoice } from './invoices/application/commands/cancel-invoice/cancel-invoice';
import { PayInvoice } from './invoices/application/commands/pay-invoice/pay-invoice';
import { CreateAuthflowPolicy } from './financial-authorization/application/commands/create-authflow-policy';
import { ApproveActionOnDocument } from './financial-authorization/application/commands/approve-action-on-document';
import { CanApproverApprove } from './financial-authorization/application/queries/can-approver-approve';
import { OnInvoiceIssued } from './financial-authorization/application/event-handlers/on-invoice-issued';

type Infrastructure = {
    session: Session;
    domainEvents: DomainEvents;
};

export const bootstrap = async (infra: Infrastructure) => {
    const onInvoiceIssued = new OnInvoiceIssued(
        infra.session,
        infra.domainEvents
    );
    await onInvoiceIssued.register();

    const canApproverApprove = new CanApproverApprove(infra.session);

    return {
        createDraftInvoice: new CreateDraftInvoice(infra.session),
        updateDraftInvoice: new UpdateDraftInvoice(infra.session),
        calculateDraftInvoice: new CalculateDraftInvoice(),
        completeDraftInvoice: new CompleteDraftInvoice(infra.session),
        archiveDraftInvoice: new ArchiveDraftInvoice(infra.session),
        draftDraftInvoice: new DraftDraftInvoice(infra.session),
        processInvoice: new ProcessInvoice(infra.session),
        cancelInvoice: new CancelInvoice(infra.session),
        payInvoice: new PayInvoice(infra.session, canApproverApprove),
        createAuthflowPolicy: new CreateAuthflowPolicy(infra.session),
        approveActionOnDocument: new ApproveActionOnDocument(infra.session),
        canApproverApprove,
    };
};
