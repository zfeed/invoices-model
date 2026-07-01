import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export function registerSwagger(fastify: FastifyInstance) {
    fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Invoices API',
                description:
                    'HTTP API for the invoices and financial-authorization bounded contexts.',
                version: '1.0.0',
            },
        },
        transform: jsonSchemaTransform,
    });

    fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
    });
}
