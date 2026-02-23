import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const cancelInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/:id/cancel', async (request) => {
        const id = request.params.id;
        const result = await commands.cancelInvoice.execute(id);
        return { data: result };
    });
};
