import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const completeDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/drafts/:id/complete', async (request) => {
        const id = request.params.id;
        const result = await commands.completeDraftInvoice.execute(id);
        return { data: result };
    });
};
