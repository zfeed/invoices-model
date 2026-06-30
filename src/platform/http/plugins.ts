import { FastifyInstance } from 'fastify';

import type { Kysely } from '../../../database/kysely.ts';
import { Core } from '../../core/bootstrap.ts';
import { draftInvoicesPlugin } from '../../core/invoices/http/draft-invoices/index.ts';
import { invoicesPlugin } from '../../core/invoices/http/invoices/index.ts';
import { financialAuthorizationPlugin } from '../../core/financial-authorization/http/index.ts';
import { organizationsPlugin } from '../../core/organizations/http/index.ts';
import { createAuthHook } from './authentication.ts';

export function init(fastify: FastifyInstance, core: Core, kysely: Kysely) {
    fastify.register(organizationsPlugin(core));

    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', createAuthHook(kysely));
        await protectedRoutes.register(draftInvoicesPlugin(core));
        await protectedRoutes.register(invoicesPlugin(core));
        await protectedRoutes.register(financialAuthorizationPlugin(core));
    });
}
