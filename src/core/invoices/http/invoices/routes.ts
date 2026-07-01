import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Commands } from '../../../../platform/http/types.ts';
import {
    dataResponse,
    errorResponsesFor,
} from '../../../../platform/http/response.ts';
import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import {
    invoiceDtoSchema,
    invoiceIdParamSchema,
    payInvoiceSchema,
} from './schemas.ts';

const tags = ['invoices'];

const invoiceResponse = (
    ...codes: [KNOWN_ERROR_CODE, ...KNOWN_ERROR_CODE[]]
) => ({
    200: dataResponse(invoiceDtoSchema),
    ...errorResponsesFor(...codes),
});

// Route handlers
const processInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/invoices/:id/process',
        {
            schema: {
                tags,
                params: invoiceIdParamSchema,
                response: invoiceResponse(
                    KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                    KNOWN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION
                ),
            },
        },
        async (request) => {
            const result = await commands.processInvoice.execute(
                request.params.id
            );
            return { data: result };
        }
    );
};

const cancelInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/invoices/:id/cancel',
        {
            schema: {
                tags,
                params: invoiceIdParamSchema,
                response: invoiceResponse(
                    KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                    KNOWN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION
                ),
            },
        },
        async (request) => {
            const result = await commands.cancelInvoice.execute(
                request.params.id
            );
            return { data: result };
        }
    );
};

const payInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/invoices/:id/pay',
        {
            schema: {
                tags,
                params: invoiceIdParamSchema,
                body: payInvoiceSchema,
                response: invoiceResponse(
                    KNOWN_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
                    KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                    KNOWN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION
                ),
            },
        },
        async (request) => {
            const result = await commands.payInvoice.execute({
                id: request.params.id,
                ...request.body,
            });
            return { data: result };
        }
    );
};

const getInvoice = (commands: Commands) => async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/invoices/:id',
        {
            schema: {
                tags,
                params: invoiceIdParamSchema,
                response: invoiceResponse(KNOWN_ERROR_CODE.ITEM_NOT_FOUND),
            },
        },
        async (request) => {
            const result = await commands.getInvoice.execute(request.params.id);
            return { data: result };
        }
    );
};

// Main plugin to register all invoice routes
export const invoicesPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(processInvoice(commands));
        await app.register(cancelInvoice(commands));
        await app.register(payInvoice(commands));
        await app.register(getInvoice(commands));
    };
