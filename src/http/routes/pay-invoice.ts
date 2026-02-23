import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';

const payInvoiceSchema = z.object({
    approverId: z.string(),
});

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const payInvoiceRoute = (app: FastifyInstance, commands: Commands) => {
    app.post<{ Params: { id: string } }>('/invoices/:id/pay', async (request) => {
        const id = request.params.id;
        const data = parse(payInvoiceSchema, request.body);
        const result = await commands.payInvoice.execute({ id, ...data });
        return { data: result };
    });
};
