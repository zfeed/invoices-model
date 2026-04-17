import { FastifyReply, FastifyRequest } from 'fastify';
import { AppKnownError } from '../shared/errors/app-known-error.ts';
import { ValidationError } from './validation.ts';

const isFastifyError = (err: unknown): err is Error & { code: string } =>
    err instanceof Error && 'code' in err;

export const errorHandler = (
    error: unknown,
    _request: FastifyRequest,
    reply: FastifyReply
) => {
    if (
        isFastifyError(error) &&
        error.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
    ) {
        return reply
            .code(400)
            .send({ error: { message: 'Invalid JSON', issues: [] } });
    }
    if (error instanceof ValidationError) {
        return reply.code(400).send({
            error: {
                message: 'Validation failed',
                issues: error.issues,
            },
        });
    }
    if (error instanceof AppKnownError) {
        return reply.code(422).send({
            error: { message: error.message, code: error.code },
        });
    }
    return reply.code(500).send({
        error: { message: 'Internal Server Error' },
    });
};
