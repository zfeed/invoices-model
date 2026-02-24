import Fastify from 'fastify';
import { bootstrap } from '../core/bootstrap';
import { InMemoryUnitOfWorkFactory } from '../infrastructure/unit-of-work/in-memory.unit-of-work';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import { createDraftInvoiceRoute } from './routes/create-draft-invoice';
import { updateDraftInvoiceRoute } from './routes/update-draft-invoice';
import { calculateDraftInvoiceRoute } from './routes/calculate-draft-invoice';
import { completeDraftInvoiceRoute } from './routes/complete-draft-invoice';
import { archiveDraftInvoiceRoute } from './routes/archive-draft-invoice';
import { draftDraftInvoiceRoute } from './routes/draft-draft-invoice';
import { processInvoiceRoute } from './routes/process-invoice';
import { cancelInvoiceRoute } from './routes/cancel-invoice';
import { payInvoiceRoute } from './routes/pay-invoice';
import { createAuthflowPolicyRoute } from './routes/create-authflow-policy';
import { approveActionOnDocumentRoute } from './routes/approve-action-on-document';
import { canApproverApproveRoute } from './routes/can-approver-approve';
import { errorHandler } from './error-handler';

export const createApp = async () => {
    const commands = await bootstrap({
        unitOfWorkFactory: new InMemoryUnitOfWorkFactory(),
        domainEvents: new InMemoryDomainEvents(),
    });

    const app = Fastify();

    app.setErrorHandler(errorHandler);

    app.register(createDraftInvoiceRoute(commands));
    app.register(updateDraftInvoiceRoute(commands));
    app.register(calculateDraftInvoiceRoute(commands));
    app.register(completeDraftInvoiceRoute(commands));
    app.register(archiveDraftInvoiceRoute(commands));
    app.register(draftDraftInvoiceRoute(commands));
    app.register(processInvoiceRoute(commands));
    app.register(cancelInvoiceRoute(commands));
    app.register(payInvoiceRoute(commands));
    app.register(createAuthflowPolicyRoute(commands));
    app.register(approveActionOnDocumentRoute(commands));
    app.register(canApproverApproveRoute(commands));

    return app;
};
