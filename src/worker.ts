import path from 'path';
import {
    NativeConnection,
    Runtime,
    Worker,
    NativeConnectionOptions,
} from '@temporalio/worker';
import { Session } from './shared/unit-of-work/unit-of-work';
import { Logger } from './shared/logger/logger';
import { toTemporalLogger } from './infrastructure/logger/temporal-logger-adapter';

let runtimeInstalled = false;
import { Paypal } from './features/paypal/api/paypal';
import {
    INVOICE_PAYPAL_TX_TASK_QUEUE,
    buildActivities,
    Activities,
} from './features/invoice-paypal-transaction';

type Temporal = {
    nativeConnectionOptions: NativeConnectionOptions;
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
            Runtime.install({ logger: toTemporalLogger(this.logger) });
            runtimeInstalled = true;
        }

        this.nativeConnection = await NativeConnection.connect(
            this.temporal.nativeConnectionOptions
        );

        this.worker = await Worker.create({
            connection: this.nativeConnection,
            taskQueue: INVOICE_PAYPAL_TX_TASK_QUEUE,
            workflowsPath: path.resolve(
                __dirname,
                'features/invoice-paypal-transaction/workflow/process-invoice-paypal-transaction.workflow.ts'
            ),
            activities: this.activities,
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
