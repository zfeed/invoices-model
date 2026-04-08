import path from 'path';
import {
    NativeConnection,
    Worker,
    NativeConnectionOptions,
} from '@temporalio/worker';
import { Session } from './shared/unit-of-work/unit-of-work';
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
    private nativeConnection?: NativeConnection;
    private worker?: Worker;
    private runPromise?: Promise<void>;

    constructor(options: {
        temporal: Temporal;
        paypal: Paypal;
        session: Session;
    }) {
        this.activities = buildActivities(options);
        this.temporal = options.temporal;
    }

    async start() {
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

        this.runPromise = this.worker.run();
        await this.runPromise;
    }

    async shutdown() {
        this.worker?.shutdown();
        await this.runPromise;
        await this.nativeConnection?.close();
    }
}
