import { FastifyInstance } from 'fastify';
import { Commands } from '../../../platform/http/types.ts';
import { parse } from '../../../platform/http/validation.ts';
import { createOrganizationSchema } from './schemas.ts';

const createOrganization =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post('/organizations', async (request) => {
            const data = parse(createOrganizationSchema, request.body);
            const result = await commands.createOrganization(data);
            return { data: result };
        });
    };

export const organizationsPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createOrganization(commands));
    };
