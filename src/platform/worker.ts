import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    NativeConnection,
    Runtime,
    Worker,
    NativeConnectionOptions,
} from '@temporalio/worker';
import {
    OpenTelemetryActivityInboundInterceptor,
    makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker/index.js';
import { Session } from '../core/bulding-blocks/unit-of-work/unit-of-work.ts';
import { Logger } from '../core/bulding-blocks/logger/logger.ts';
import { resource, traceExporter } from '../instrumentation.ts';

let runtimeInstalled = false;
import { Paypal } from '../lib/paypal/paypal.ts';
import {
    INVOICE_PAYPAL_TX_TASK_QUEUE,
    buildActivities,
    Activities,
} from '../core/invoice-paypal-transaction/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Temporal = {
    nativeConnectionOptions: NativeConnectionOptions;
    namespace: string;
    metrics: {
        endpoint: string;
        exportIntervalMs: number;
    };
};

export class TemporalWorker {
    private activities: Activities;
    private temporal: Temporal;
    private logger: Logger;
    private nativeConnection?: NativeConnection;
    private worker?: Worker;
    private runPromise?: Promise<void>;

    constructor(options: {
        temporal: Temporal;
        paypal: Paypal;
        session: Session;
        logger: Logger;
    }) {
        this.activities = buildActivities(options);
        this.temporal = options.temporal;
        this.logger = options.logger;
    }

    async start() {
        this.logger.info('Starting Temporal worker', {
            taskQueue: INVOICE_PAYPAL_TX_TASK_QUEUE,
        });

        if (!runtimeInstalled) {
            Runtime.install({
                logger: this.logger,
                telemetryOptions: {
                    metrics: {
                        otel: {
                            url: this.temporal.metrics.endpoint,
                            http: true,
                            metricsExportInterval:
                                this.temporal.metrics.exportIntervalMs,
                        },
                    },
                },
            });
            runtimeInstalled = true;
        }

        this.nativeConnection = await NativeConnection.connect(
            this.temporal.nativeConnectionOptions
        );

        this.worker = await Worker.create({
            connection: this.nativeConnection,
            namespace: this.temporal.namespace,
            taskQueue: INVOICE_PAYPAL_TX_TASK_QUEUE,
            workflowsPath: path.resolve(
                __dirname,
                '../core/invoice-paypal-transaction/workflow/process-invoice-paypal-transaction.workflow.ts'
            ),
            activities: this.activities,
            interceptors: {
                workflowModules: [
                    path.resolve(
                        __dirname,
                        '../core/invoice-paypal-transaction/workflow/workflow-interceptors.ts'
                    ),
                ],
                activity: [
                    (ctx) => ({
                        inbound: new OpenTelemetryActivityInboundInterceptor(
                            ctx
                        ),
                    }),
                ],
            },
            sinks: {
                // @temporalio/interceptors-opentelemetry still bundles
                // @opentelemetry/sdk-trace-base@1.x while this app runs on 2.x, so
                // `makeWorkflowExporter`'s declared parameter types come from 1.x and
                // don't match our 2.x `OTLPTraceExporter`. Runtime is compatible — only
                // `.export(spans, cb)` is invoked on the exporter, and 2.x `ReadableSpan`
                // is a structural superset of 1.x (adds `instrumentationScope`).
                // Tracked upstream: https://github.com/temporalio/sdk-typescript/issues/1658
                // Drop this suppression once the interceptor package upgrades to OTel 2.x.
                // @ts-expect-error upstream OTel v1/v2 SDK duplication (see issue #1658)
                exporter: makeWorkflowExporter(traceExporter, resource),
            },
        });

        this.logger.info('Temporal worker started');
        this.runPromise = this.worker.run();
        await this.runPromise;
    }

    async shutdown() {
        this.logger.info('Shutting down Temporal worker');
        this.worker?.shutdown();
        await this.runPromise;
        await this.nativeConnection?.close();
        this.logger.info('Temporal worker shut down');
    }
}
