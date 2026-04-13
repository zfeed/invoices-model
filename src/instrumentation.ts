import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { DnsInstrumentation } from '@opentelemetry/instrumentation-dns';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { config } from './config';

const traceExporter = new OTLPTraceExporter({
    url: config.otel.tracesEndpoint,
});

const logExporter = new OTLPLogExporter({
    url: config.otel.logsEndpoint,
});

const sdk = new NodeSDK({
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
    logRecordProcessor: new BatchLogRecordProcessor(logExporter),
    instrumentations: [
        new HttpInstrumentation(),
        new DnsInstrumentation(),
        new NetInstrumentation(),
        new UndiciInstrumentation(),
        new PinoInstrumentation(),
        new PgInstrumentation(),
        new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    ],
});

sdk.start();
