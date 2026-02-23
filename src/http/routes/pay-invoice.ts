import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../types';
import { parse } from '../validation';

const payInvoiceSchema = z.object({
    approverId: z.string(),
});

export const payInvoiceRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { id: string } }>('/invoices/:id/pay', async (request) => {
            const id = request.params.id;
            const data = parse(payInvoiceSchema, request.body);
            const result = await commands.payInvoice.execute({ id, ...data });
            return { data: result };
        });
    };
