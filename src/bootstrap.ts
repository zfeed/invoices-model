import { DomainEventsBus } from './shared/domain-events/domain-events-bus.interface';
import { Session } from './shared/unit-of-work/unit-of-work';
import { CreateDraftInvoice } from './features/invoices/application/commands/create-draft-invoice/create-draft-invoice';
import { UpdateDraftInvoice } from './features/invoices/application/commands/update-draft-invoice/update-draft-invoice';
import { CalculateDraftInvoice } from './features/invoices/application/commands/calculate-draft-invoice/calculate-draft-invoice';
import { CompleteDraftInvoice } from './features/invoices/application/commands/complete-draft-invoice/complete-draft-invoice';
import { ArchiveDraftInvoice } from './features/invoices/application/commands/archive-draft-invoice/archive-draft-invoice';
import { DraftDraftInvoice } from './features/invoices/application/commands/draft-draft-invoice/draft-draft-invoice';
import { ProcessInvoice } from './features/invoices/application/commands/process-invoice/process-invoice';
import { CancelInvoice } from './features/invoices/application/commands/cancel-invoice/cancel-invoice';
import { PayInvoice } from './features/invoices/application/commands/pay-invoice/pay-invoice';
import { GetInvoice } from './features/invoices/application/queries/get-invoice/get-invoice';
import { CreateAuthflowPolicy } from './features/financial-authorization/application/commands/create-authflow-policy';
import { ApproveActionOnDocument } from './features/financial-authorization/application/commands/approve-action-on-document';
import { CanApproverApprove } from './features/financial-authorization/application/queries/can-approver-approve';
import { OnInvoiceIssued } from './features/financial-authorization/application/event-handlers/on-invoice-issued';
import { WorkflowClient } from '@temporalio/client';
import {
    OnInvoiceProcessing,
    PollingConfig,
} from './features/invoice-paypal-transaction/on-invoice-processing.event-handler';
import { Kysely } from '../database/kysely';

type Infrastructure = {
    session: Session;
    domainEventsBus: DomainEventsBus;
    temporalClient: WorkflowClient;
    paypalPolling: PollingConfig;
    kysely: Kysely;
};

export const bootstrap = async (infra: Infrastructure) => {
    const onInvoiceIssued = new OnInvoiceIssued(
        infra.session,
        infra.domainEventsBus
    );
    await onInvoiceIssued.register();

    const onInvoiceProcessing = new OnInvoiceProcessing(
        infra.domainEventsBus,
        infra.temporalClient,
        infra.paypalPolling
    );
    await onInvoiceProcessing.register();

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
        getInvoice: new GetInvoice(infra.kysely),
        createAuthflowPolicy: new CreateAuthflowPolicy(infra.session),
        approveActionOnDocument: new ApproveActionOnDocument(infra.session),
        canApproverApprove,
        start: async () => infra.domainEventsBus.start(),
        shutdown: async () => infra.domainEventsBus.stop(),
    };
};
