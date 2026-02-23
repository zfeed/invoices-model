import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const cancelInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/:id/cancel', async (request) => {
            const id = request.params.id;
            const result = await commands.cancelInvoice.execute(id);
            return { data: result };
        });
    };
