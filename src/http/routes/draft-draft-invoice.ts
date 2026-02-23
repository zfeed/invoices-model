import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const draftDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/drafts/:id/draft', async (request) => {
        const id = request.params.id;
        const result = await commands.draftDraftInvoice.execute(id);
        return { data: result };
    });
};
