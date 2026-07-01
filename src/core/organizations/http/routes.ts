import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Commands } from '../../../platform/http/types.ts';
import {
    dataResponse,
    errorResponses,
} from '../../../platform/http/response.ts';
import {
    createOrganizationResponseSchema,
    createOrganizationSchema,
} from './schemas.ts';

const createOrganization =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/organizations',
            {
                schema: {
                    tags: ['organizations'],
                    body: createOrganizationSchema,
                    response: {
                        200: dataResponse(createOrganizationResponseSchema),
                        ...errorResponses,
                    },
                },
            },
            async (request) => {
                const result = await commands.createOrganization(request.body);
                return { data: result };
            }
        );
    };

export const organizationsPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createOrganization(commands));
    };
