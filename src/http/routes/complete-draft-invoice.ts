import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const completeDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/drafts/:id/complete', async (request) => {
            const id = request.params.id;
            const result = await commands.completeDraftInvoice.execute(id);
            return { data: result };
        });
    };
