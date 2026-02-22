import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const cancelInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/:id/cancel', async (c) => {
        const id = c.req.param('id');
        const result = await commands.cancelInvoice.execute(id);
        return c.json({ data: result });
    });
};
