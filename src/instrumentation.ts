import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    SimpleSpanProcessor,
    ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { config } from './config';

const logExporter = new OTLPLogExporter({
    url: config.otel.logsEndpoint,
});

const sdk = new NodeSDK({
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
    logRecordProcessor: new BatchLogRecordProcessor(logExporter),
    instrumentations: [new PinoInstrumentation()],
});

sdk.start();
