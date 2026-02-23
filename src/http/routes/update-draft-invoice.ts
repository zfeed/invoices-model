import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const updateDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/drafts/:id/update', async (request) => {
        const id = request.params.id;
        const data = parse(draftInvoiceSchema, request.body);
        const result = await commands.updateDraftInvoice.execute(id, data);
        return { data: result };
    });
};
