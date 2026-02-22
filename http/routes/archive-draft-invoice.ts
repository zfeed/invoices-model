import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const archiveDraftInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/drafts/:id/archive', async (c) => {
        const id = c.req.param('id');
        const result = await commands.archiveDraftInvoice.execute(id);
        return c.json({ data: result });
    });
};
