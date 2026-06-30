import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import type { Kysely } from '../../../database/kysely.ts';
import { organizationContext } from '../../lib/organization-context/organization-context.ts';
import { isUUID } from '../../lib/is-uuid/is-uuid.ts';

const ORGANIZATION_HEADER = 'x-organization-id';
const MEMBER_HEADER = 'x-member-id';

const readId = (request: FastifyRequest, name: string): string | undefined => {
    const value = request.headers[name];
    return typeof value === 'string' && isUUID(value) ? value : undefined;
};

const unauthorized = (reply: FastifyReply) =>
    reply.code(401).send({ error: { message: 'Unauthorized' } });

export const createAuthHook =
    (kysely: Kysely) =>
    (
        request: FastifyRequest,
        reply: FastifyReply,
        done: HookHandlerDoneFunction
    ): void => {
        void (async () => {
            const organizationId = readId(request, ORGANIZATION_HEADER);
            const memberId = readId(request, MEMBER_HEADER);

            if (!organizationId || !memberId) {
                await unauthorized(reply);
                return;
            }

            const member = await kysely
                .selectFrom('members')
                .where('members.id', '=', memberId)
                .where('members.organization_id', '=', organizationId)
                .select('members.id')
                .executeTakeFirst();

            if (!member) {
                await unauthorized(reply);
                return;
            }

            organizationContext.run({ organizationId }, done);
        })().catch(done);
    };
