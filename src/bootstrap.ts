import { DomainEventsBus } from './shared/domain-events/domain-events-bus.interface.ts';
import { Session } from './shared/unit-of-work/unit-of-work.ts';
import { CreateDraftInvoice } from './features/invoices/application/commands/create-draft-invoice/create-draft-invoice.ts';
import { UpdateDraftInvoice } from './features/invoices/application/commands/update-draft-invoice/update-draft-invoice.ts';
import { CalculateDraftInvoice } from './features/invoices/application/commands/calculate-draft-invoice/calculate-draft-invoice.ts';
import { CompleteDraftInvoice } from './features/invoices/application/commands/complete-draft-invoice/complete-draft-invoice.ts';
import { ArchiveDraftInvoice } from './features/invoices/application/commands/archive-draft-invoice/archive-draft-invoice.ts';
import { DraftDraftInvoice } from './features/invoices/application/commands/draft-draft-invoice/draft-draft-invoice.ts';
import { ProcessInvoice } from './features/invoices/application/commands/process-invoice/process-invoice.ts';
import { CancelInvoice } from './features/invoices/application/commands/cancel-invoice/cancel-invoice.ts';
import { PayInvoice } from './features/invoices/application/commands/pay-invoice/pay-invoice.ts';
import { GetInvoice } from './features/invoices/application/queries/get-invoice/get-invoice.ts';
import { CreateAuthflowPolicy } from './features/financial-authorization/application/commands/create-authflow-policy.ts';
import { ApproveActionOnDocument } from './features/financial-authorization/application/commands/approve-action-on-document.ts';
import { CanApproverApprove } from './features/financial-authorization/application/queries/can-approver-approve.ts';
import { OnInvoiceIssued } from './features/financial-authorization/application/event-handlers/on-invoice-issued.ts';
import { WorkflowClient } from '@temporalio/client';
import {
    OnInvoiceProcessing,
    PollingConfig,
} from './features/invoice-paypal-transaction/on-invoice-processing.event-handler.ts';
import { Kysely } from '../database/kysely.ts';

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
