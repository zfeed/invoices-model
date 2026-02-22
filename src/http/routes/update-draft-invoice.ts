import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const updateDraftInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/drafts/:id/update', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = parse(draftInvoiceSchema, body);
        const result = await commands.updateDraftInvoice.execute(id, data);
        return c.json({ data: result });
    });
};
