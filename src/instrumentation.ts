import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { DnsInstrumentation } from '@opentelemetry/instrumentation-dns';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { getConfig } from './config.ts';

const config = getConfig();

export const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'invoices-model',
});

export const traceExporter = new OTLPTraceExporter({
    url: config.otel.tracesEndpoint,
});

const spanProcessor = new BatchSpanProcessor(traceExporter);

const logExporter = new OTLPLogExporter({
    url: config.otel.logsEndpoint,
});

const metricExporter = new OTLPMetricExporter({
    url: config.otel.metricsEndpoint,
});

const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: config.otel.metricsExportIntervalMs,
});

const sdk = new NodeSDK({
    resource,
    spanProcessors: [spanProcessor],
    logRecordProcessor: new BatchLogRecordProcessor(logExporter),
    metricReader,
    instrumentations: [
        new HttpInstrumentation(),
        new DnsInstrumentation(),
        new NetInstrumentation(),
        new UndiciInstrumentation(),
        new RuntimeNodeInstrumentation(),
        new PinoInstrumentation(),
        new PgInstrumentation(),
        new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    ],
});

sdk.start();
