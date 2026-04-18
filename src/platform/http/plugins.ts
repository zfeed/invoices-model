import { FastifyInstance } from 'fastify';

import { Core } from '../../core/bootstrap.ts';
import { draftInvoicesPlugin } from '../../core/invoices/http/draft-invoices/index.ts';
import { invoicesPlugin } from '../../core/invoices/http/invoices/index.ts';
import { financialAuthorizationPlugin } from '../../core/financial-authorization/http/index.ts';

export function init(fastify: FastifyInstance, core: Core) {
    fastify.register(draftInvoicesPlugin(core));
    fastify.register(invoicesPlugin(core));
    fastify.register(financialAuthorizationPlugin(core));
}
