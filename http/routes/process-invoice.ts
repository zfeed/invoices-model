import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const processInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/:id/process', async (c) => {
        const id = c.req.param('id');
        const result = await commands.processInvoice.execute(id);
        return c.json({ data: result });
    });
};
