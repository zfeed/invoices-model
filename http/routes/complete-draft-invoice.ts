import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const completeDraftInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/drafts/:id/complete', async (c) => {
        const id = c.req.param('id');
        const result = await commands.completeDraftInvoice.execute(id);
        return c.json({ data: result });
    });
};
