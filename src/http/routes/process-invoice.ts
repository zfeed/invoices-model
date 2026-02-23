import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const processInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/:id/process', async (request) => {
        const id = request.params.id;
        const result = await commands.processInvoice.execute(id);
        return { data: result };
    });
};
