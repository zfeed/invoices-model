import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const processInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/:id/process', async (request) => {
            const id = request.params.id;
            const result = await commands.processInvoice.execute(id);
            return { data: result };
        });
    };
