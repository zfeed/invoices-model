import Fastify from 'fastify';
import { DomainError } from '../building-blocks/errors/domain/domain.error';
import { ApplicationError } from '../building-blocks/errors/application/application.error';
import { bootstrap } from '../core/bootstrap';
import { ValidationError } from './validation';
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

export const createApp = async () => {
    const commands = await bootstrap({
        unitOfWorkFactory: new InMemoryUnitOfWorkFactory(),
        domainEvents: new InMemoryDomainEvents(),
    });

    const app = Fastify();

    const isFastifyError = (err: unknown): err is Error & { code: string } =>
        err instanceof Error && 'code' in err;

    app.setErrorHandler((error, _request, reply) => {
        if (
            isFastifyError(error) &&
            error.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
        ) {
            return reply
                .code(400)
                .send({ error: { message: 'Invalid JSON', issues: [] } });
        }
        if (error instanceof ValidationError) {
            return reply.code(400).send({
                error: {
                    message: 'Validation failed',
                    issues: error.issues,
                },
            });
        }
        if (error instanceof DomainError || error instanceof ApplicationError) {
            return reply.code(422).send({
                error: { message: error.message, code: error.code },
            });
        }
        return reply.code(500).send({
            error: { message: 'Internal Server Error' },
        });
    });

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
