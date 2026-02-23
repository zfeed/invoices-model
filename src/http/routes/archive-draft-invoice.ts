import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const archiveDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/drafts/:id/archive', async (request) => {
            const id = request.params.id;
            const result = await commands.archiveDraftInvoice.execute(id);
            return { data: result };
        });
    };
