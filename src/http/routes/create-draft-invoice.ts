import { FastifyInstance } from 'fastify';
import { Commands } from '../types';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

export const createDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post('/invoices/drafts', async (request) => {
            const data = parse(draftInvoiceSchema, request.body);
            const result = await commands.createDraftInvoice.execute(data);
            return { data: result };
        });
    };
