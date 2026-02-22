import { Hono } from 'hono';
import { bootstrap } from '../../core/bootstrap';
import { parse } from '../validation';
import { draftInvoiceSchema } from '../schemas/draft-invoice';

type Commands = Awaited<ReturnType<typeof bootstrap>>;

export const calculateDraftInvoiceRoute = (app: Hono, commands: Commands) => {
    app.post('/invoices/drafts/calculate', async (c) => {
        const body = await c.req.json();
        const data = parse(draftInvoiceSchema, body);
        const result = commands.calculateDraftInvoice.execute(data);
        return c.json({ data: result });
    });
};
