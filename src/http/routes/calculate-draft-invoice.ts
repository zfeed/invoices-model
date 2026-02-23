import { FastifyInstance } from 'fastify';
import { Commands } from '../types';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

export const calculateDraftInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post('/invoices/drafts/calculate', async (request) => {
            const data = parse(draftInvoiceSchema, request.body);
            const result = commands.calculateDraftInvoice.execute(data);
            return { data: result };
        });
    };
