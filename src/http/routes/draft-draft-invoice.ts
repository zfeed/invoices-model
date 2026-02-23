import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const draftDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/drafts/:id/draft', async (request) => {
            const id = request.params.id;
            const result = await commands.draftDraftInvoice.execute(id);
            return { data: result };
        });
    };
