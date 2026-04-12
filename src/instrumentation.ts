import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    SimpleSpanProcessor,
    ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';
import {
    SimpleLogRecordProcessor,
    ConsoleLogRecordExporter,
} from '@opentelemetry/sdk-logs';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

const sdk = new NodeSDK({
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
    logRecordProcessor: new SimpleLogRecordProcessor(
        new ConsoleLogRecordExporter()
    ),
    instrumentations: [new PinoInstrumentation()],
});

sdk.start();
