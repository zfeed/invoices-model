import { FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppKnownError } from '../../core/building-blocks/errors/app-known-error.ts';
import { ValidationError } from './validation.ts';

const isFastifyError = (err: unknown): err is Error & { code: string } =>
    err instanceof Error && 'code' in err;

export const errorHandler = (
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    if (
        isFastifyError(error) &&
        error.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
    ) {
        request.log.warn({ err: error }, 'invalid JSON body');
        return reply
            .code(400)
            .send({ error: { message: 'Invalid JSON', issues: [] } });
    }
    if (hasZodFastifySchemaValidationErrors(error)) {
        const issues = error.validation.map((issue) => ({
            path: issue.instancePath
                .split('/')
                .filter(Boolean)
                .map((segment) =>
                    /^\d+$/.test(segment) ? Number(segment) : segment
                ),
            message: issue.message,
        }));
        request.log.warn({ err: error, issues }, 'validation failed');
        return reply.code(400).send({
            error: {
                message: 'Validation failed',
                issues,
            },
        });
    }
    if (error instanceof ValidationError) {
        request.log.warn(
            { err: error, issues: error.issues },
            'validation failed'
        );
        return reply.code(400).send({
            error: {
                message: 'Validation failed',
                issues: error.issues,
            },
        });
    }
    if (error instanceof AppKnownError) {
        request.log.warn({ err: error, code: error.code }, 'app known error');
        return reply.code(422).send({
            error: { message: error.message, code: error.code },
        });
    }
    request.log.error({ err: error }, 'unhandled error');
    return reply.code(500).send({
        error: { message: 'Internal Server Error' },
    });
};
