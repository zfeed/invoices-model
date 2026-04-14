import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
    database: z.object({
        url: z.string().url(),
    }),
    temporal: z.object({
        address: z.string().min(1),
        namespace: z.string().min(1),
    }),
    paypal: z.object({
        baseUrl: z.string().url(),
        credentials: z.object({
            clientId: z.string().min(1),
            clientSecret: z.string().min(1),
        }),
        polling: z.object({
            maxAttempts: z.coerce.number().int().positive(),
            initialDelayMs: z.coerce.number().int().positive(),
            factor: z.coerce.number().positive(),
        }),
    }),
    kafka: z.object({
        brokers: z
            .string()
            .min(1)
            .transform((s) => s.split(',')),
        clientId: z.string().min(1),
        groupId: z.string().min(1),
        topicPrefix: z.string().min(1),
    }),
    logger: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    }),
    otel: z.object({
        logsEndpoint: z.string().url(),
        tracesEndpoint: z.string().url(),
        metricsEndpoint: z.string().url(),
        metricsExportIntervalMs: z.coerce.number().int().positive(),
    }),
    outbox: z.object({
        pollingIntervalSeconds: z.coerce.number().int().positive(),
        pollingTimeoutMinutes: z.coerce.number().int().positive(),
        maxDeliveryAttempts: z.coerce.number().int().positive(),
        batchSize: z.coerce.number().int().positive(),
    }),
});

export type Config = z.infer<typeof schema>;

export const config: Config = schema.parse({
    database: {
        url: process.env.DATABASE_URL,
    },
    temporal: {
        address: process.env.TEMPORAL_ADDRESS,
        namespace: process.env.TEMPORAL_NAMESPACE,
    },
    paypal: {
        baseUrl: process.env.PAYPAL_BASE_URL,
        credentials: {
            clientId: process.env.PAYPAL_CLIENT_ID,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        },
        polling: {
            maxAttempts: process.env.PAYPAL_POLL_MAX_ATTEMPTS,
            initialDelayMs: process.env.PAYPAL_POLL_INITIAL_DELAY_MS,
            factor: process.env.PAYPAL_POLL_FACTOR,
        },
    },
    kafka: {
        brokers: process.env.KAFKA_BROKERS,
        clientId: process.env.KAFKA_CLIENT_ID,
        groupId: process.env.KAFKA_GROUP_ID,
        topicPrefix: process.env.KAFKA_TOPIC_PREFIX,
    },
    logger: {
        level: process.env.LOG_LEVEL,
    },
    otel: {
        logsEndpoint: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
        tracesEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
        metricsEndpoint: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
        metricsExportIntervalMs: process.env.OTEL_METRIC_EXPORT_INTERVAL_MS,
    },
    outbox: {
        pollingIntervalSeconds: process.env.OUTBOX_POLLING_INTERVAL_S,
        pollingTimeoutMinutes: process.env.OUTBOX_POLLING_TIMEOUT_M,
        maxDeliveryAttempts: process.env.OUTBOX_MAX_DELIVERY_ATTEMPTS,
        batchSize: process.env.OUTBOX_BATCH_SIZE,
    },
});
