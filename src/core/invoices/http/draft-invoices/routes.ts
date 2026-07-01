import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Commands } from '../../../../platform/http/types.ts';
import {
    dataResponse,
    errorResponsesFor,
} from '../../../../platform/http/response.ts';
import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import {
    draftInvoiceDtoSchema,
    draftInvoiceIdParamSchema,
    draftInvoiceSchema,
} from './schemas.ts';

const tags = ['draft-invoices'];

// codes reachable while building/mutating a draft from request input
// (value objects and mutations are unwrapped, so their AppKnownErrors surface as 422)
const draftValidationCodes: [KNOWN_ERROR_CODE, ...KNOWN_ERROR_CODE[]] = [
    KNOWN_ERROR_CODE.LINE_ITEMS_EMPTY,
    KNOWN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES,
    KNOWN_ERROR_CODE.LINE_ITEMS_DUPLICATE,
    KNOWN_ERROR_CODE.LINE_ITEM_EMPTY_DESCRIPTION,
    KNOWN_ERROR_CODE.LINE_ITEM_NOT_INTEGER_QUANTITY,
    KNOWN_ERROR_CODE.LINE_ITEM_NOT_POSITIVE_QUANTITY,
    KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER,
    KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO,
    KNOWN_ERROR_CODE.CURRENCY_NOT_ISO_4217,
    KNOWN_ERROR_CODE.VAT_INVALID_PERCENTAGE,
    KNOWN_ERROR_CODE.VAT_INVALID_RANGE,
    KNOWN_ERROR_CODE.CALENDAR_DATE_INVALID_FORMAT,
    KNOWN_ERROR_CODE.INVOICE_DUE_DATE_ISSUE_DATE_INVALID_RANGE,
    KNOWN_ERROR_CODE.ISSUER_EMPTY_FIELD,
    KNOWN_ERROR_CODE.EMAIL_INVALID_FORMAT,
    KNOWN_ERROR_CODE.RECIPIENT_EMPTY_FIELD,
    KNOWN_ERROR_CODE.COUNTRY_CODE_NOT_ISO_3166_1_ALPHA_2,
    KNOWN_ERROR_CODE.DRAFT_INVOICE_LINE_ITEMS_EMPTY,
    KNOWN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION,
];

const draftResponse = (
    ...codes: [KNOWN_ERROR_CODE, ...KNOWN_ERROR_CODE[]]
) => ({
    200: dataResponse(draftInvoiceDtoSchema),
    ...errorResponsesFor(...codes),
});

// Route handlers
const createDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts',
            {
                schema: {
                    tags,
                    body: draftInvoiceSchema,
                    response: draftResponse(...draftValidationCodes),
                },
            },
            async (request) => {
                const result = await commands.createDraftInvoice.execute(
                    request.body
                );
                return { data: result };
            }
        );
    };

const updateDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts/:id/update',
            {
                schema: {
                    tags,
                    params: draftInvoiceIdParamSchema,
                    body: draftInvoiceSchema,
                    response: draftResponse(
                        ...draftValidationCodes,
                        KNOWN_ERROR_CODE.ITEM_NOT_FOUND
                    ),
                },
            },
            async (request) => {
                const result = await commands.updateDraftInvoice.execute(
                    request.params.id,
                    request.body
                );
                return { data: result };
            }
        );
    };

const calculateDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts/calculate',
            {
                schema: {
                    tags,
                    body: draftInvoiceSchema,
                    response: draftResponse(...draftValidationCodes),
                },
            },
            async (request) => {
                const result = commands.calculateDraftInvoice.execute(
                    request.body
                );
                return { data: result };
            }
        );
    };

const completeDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts/:id/complete',
            {
                schema: {
                    tags,
                    params: draftInvoiceIdParamSchema,
                    response: draftResponse(
                        KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                        KNOWN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION,
                        KNOWN_ERROR_CODE.DRAFT_INVOICE_NOT_FULLY_COMPLETE,
                        KNOWN_ERROR_CODE.INVOICE_DUE_DATE_ISSUE_DATE_INVALID_RANGE,
                        KNOWN_ERROR_CODE.MONEY_CURRENCIES_NOT_EQUAL
                    ),
                },
            },
            async (request) => {
                const result = await commands.completeDraftInvoice.execute(
                    request.params.id
                );
                return { data: result };
            }
        );
    };

const archiveDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts/:id/archive',
            {
                schema: {
                    tags,
                    params: draftInvoiceIdParamSchema,
                    response: draftResponse(
                        KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                        KNOWN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION
                    ),
                },
            },
            async (request) => {
                const result = await commands.archiveDraftInvoice.execute(
                    request.params.id
                );
                return { data: result };
            }
        );
    };

const draftDraftInvoice =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/invoices/drafts/:id/draft',
            {
                schema: {
                    tags,
                    params: draftInvoiceIdParamSchema,
                    response: draftResponse(
                        KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
                        KNOWN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION
                    ),
                },
            },
            async (request) => {
                const result = await commands.draftDraftInvoice.execute(
                    request.params.id
                );
                return { data: result };
            }
        );
    };

// Main plugin to register all draft invoice routes
export const draftInvoicesPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createDraftInvoice(commands));
        await app.register(updateDraftInvoice(commands));
        await app.register(calculateDraftInvoice(commands));
        await app.register(completeDraftInvoice(commands));
        await app.register(archiveDraftInvoice(commands));
        await app.register(draftDraftInvoice(commands));
    };
