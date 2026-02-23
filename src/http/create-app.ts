import Fastify from 'fastify';
import { DomainError } from '../building-blocks/errors/domain/domain.error';
import { ApplicationError } from '../building-blocks/errors/application/application.error';
import { bootstrap } from '../core/bootstrap';
import { ValidationError } from './validation';
import { InMemoryUnitOfWorkFactory } from '../infrastructure/unit-of-work/in-memory.unit-of-work';
import { InMemoryDomainEvents } from '../infrastructure/domain-events/in-memory-domain-events';
import { InMemoryDocumentStorage } from '../infrastructure/storage/in-memory.document-storage';
import { InMemoryPolicyStorage } from '../infrastructure/storage/in-memory.policy-storage';
import { createDraftInvoiceRoute } from './routes/create-draft-invoice';
import { updateDraftInvoiceRoute } from './routes/update-draft-invoice';
import { calculateDraftInvoiceRoute } from './routes/calculate-draft-invoice';
import { completeDraftInvoiceRoute } from './routes/complete-draft-invoice';
import { archiveDraftInvoiceRoute } from './routes/archive-draft-invoice';
import { draftDraftInvoiceRoute } from './routes/draft-draft-invoice';
import { processInvoiceRoute } from './routes/process-invoice';
import { cancelInvoiceRoute } from './routes/cancel-invoice';
import { payInvoiceRoute } from './routes/pay-invoice';

export const createApp = async () => {
    const commands = await bootstrap({
        unitOfWorkFactory: new InMemoryUnitOfWorkFactory(),
        domainEvents: new InMemoryDomainEvents(),
        documentStorage: new InMemoryDocumentStorage(),
        policyStorage: new InMemoryPolicyStorage(),
    });

    const app = Fastify();

    app.addContentTypeParser(
        'application/json',
        { parseAs: 'string' },
        (_req, body, done) => {
            try {
                done(null, JSON.parse(body as string));
            } catch (err) {
                (err as any).statusCode = 400;
                done(err as Error, undefined);
            }
        }
    );

    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof SyntaxError) {
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
        if (
            error instanceof DomainError ||
            error instanceof ApplicationError
        ) {
            return reply.code(422).send({
                error: { message: error.message, code: error.code },
            });
        }
        throw error;
    });

    createDraftInvoiceRoute(app, commands);
    updateDraftInvoiceRoute(app, commands);
    calculateDraftInvoiceRoute(app, commands);
    completeDraftInvoiceRoute(app, commands);
    archiveDraftInvoiceRoute(app, commands);
    draftDraftInvoiceRoute(app, commands);
    processInvoiceRoute(app, commands);
    cancelInvoiceRoute(app, commands);
    payInvoiceRoute(app, commands);

    return app;
};
