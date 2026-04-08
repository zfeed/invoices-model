import { FastifyInstance } from 'fastify';
import { Commands } from '../../../../http/types';
import { parse } from '../../../../http/validation';
import { payInvoiceSchema } from './schemas';

// Route handlers
const processInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.post<{ Params: { id: string } }>(
        '/invoices/:id/process',
        async (request) => {
            const id = request.params.id;
            const result = await commands.processInvoice.execute(id);
            return { data: result };
        }
    );
};

const cancelInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.post<{ Params: { id: string } }>(
        '/invoices/:id/cancel',
        async (request) => {
            const id = request.params.id;
            const result = await commands.cancelInvoice.execute(id);
            return { data: result };
        }
    );
};

const payInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.post<{ Params: { id: string } }>(
        '/invoices/:id/pay',
        async (request) => {
            const id = request.params.id;
            const data = parse(payInvoiceSchema, request.body);
            const result = await commands.payInvoice.execute({ id, ...data });
            return { data: result };
        }
    );
};

const getInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.get<{ Params: { id: string } }>('/invoices/:id', async (request) => {
        const id = request.params.id;
        const result = await commands.getInvoice.execute(id);
        return { data: result };
    });
};

// Main plugin to register all invoice routes
export const invoicesPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(processInvoice(commands));
        await app.register(cancelInvoice(commands));
        await app.register(payInvoice(commands));
        await app.register(getInvoice(commands));
    };
