import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const createDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post('/invoices/drafts', async (request) => {
        const data = parse(draftInvoiceSchema, request.body);
        const result = await commands.createDraftInvoice.execute(data);
        return { data: result };
    });
};
