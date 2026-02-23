import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const archiveDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/drafts/:id/archive', async (request) => {
        const id = request.params.id;
        const result = await commands.archiveDraftInvoice.execute(id);
        return { data: result };
    });
};
