import { Hono } from 'hono';
import { z } from 'zod';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';

const payInvoiceSchema = z.object({
    approverId: z.string(),
});

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const payInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/:id/pay', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = parse(payInvoiceSchema, body);
        const result = await commands.payInvoice.execute({ id, ...data });
        return c.json({ data: result });
    });
};
