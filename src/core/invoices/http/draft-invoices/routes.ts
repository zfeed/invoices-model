import { FastifyInstance } from 'fastify';
import { Commands } from '../../../../platform/http/types.ts';
import { parse } from '../../../../platform/http/validation.ts';
import { draftInvoiceSchema } from './schemas.ts';

// Route handlers
const createDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post('/invoices/drafts', async (request) => {
            const data = parse(draftInvoiceSchema, request.body);
            const result = await commands.createDraftInvoice.execute(data);
            return { data: result };
        });
    };

const updateDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>(
            '/invoices/drafts/:id/update',
            async (request) => {
                const id = request.params.id;
                const data = parse(draftInvoiceSchema, request.body);
                const result = await commands.updateDraftInvoice.execute(
                    id,
                    data
                );
                return { data: result };
            }
        );
    };

const calculateDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post('/invoices/drafts/calculate', async (request) => {
            const data = parse(draftInvoiceSchema, request.body);
            const result = commands.calculateDraftInvoice.execute(data);
            return { data: result };
        });
    };

const completeDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>(
            '/invoices/drafts/:id/complete',
            async (request) => {
                const id = request.params.id;
                const result = await commands.completeDraftInvoice.execute(id);
                return { data: result };
            }
        );
    };

const archiveDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>(
            '/invoices/drafts/:id/archive',
            async (request) => {
                const id = request.params.id;
                const result = await commands.archiveDraftInvoice.execute(id);
                return { data: result };
            }
        );
    };

const draftDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>(
            '/invoices/drafts/:id/draft',
            async (request) => {
                const id = request.params.id;
                const result = await commands.draftDraftInvoice.execute(id);
                return { data: result };
            }
        );
    };

// Main plugin to register all draft invoice routes
export const draftInvoicesPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createDraftInvoice(commands));
        await app.register(updateDraftInvoice(commands));
        await app.register(calculateDraftInvoice(commands));
        await app.register(completeDraftInvoice(commands));
        await app.register(archiveDraftInvoice(commands));
        await app.register(draftDraftInvoice(commands));
    };
