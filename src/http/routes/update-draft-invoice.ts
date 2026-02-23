import { FastifyInstance } from 'fastify';
import { Commands } from '../types';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

export const updateDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/drafts/:id/update', async (request) => {
            const id = request.params.id;
            const data = parse(draftInvoiceSchema, request.body);
            const result = await commands.updateDraftInvoice.execute(id, data);
            return { data: result };
        });
    };
