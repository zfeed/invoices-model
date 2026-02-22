import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const draftDraftInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/drafts/:id/draft', async (c) => {
        const id = c.req.param('id');
        const result = await commands.draftDraftInvoice.execute(id);
        return c.json({ data: result });
    });
};
