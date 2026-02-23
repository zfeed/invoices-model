import { FastifyInstance } from 'fastify';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const calculateDraftInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post('/invoices/drafts/calculate', async (request) => {
        const data = parse(draftInvoiceSchema, request.body);
        const result = commands.calculateDraftInvoice.execute(data);
        return { data: result };
    });
};
