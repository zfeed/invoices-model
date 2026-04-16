import { Connection, WorkflowClient } from '@temporalio/client';
import { OpenTelemetryWorkflowClientInterceptor } from '@temporalio/interceptors-opentelemetry';
import { config } from '../../config.ts';

export const createTemporalClient = async (): Promise<WorkflowClient> => {
    const connection = await Connection.connect({
        address: config.temporal.address,
    });
    return new WorkflowClient({
        connection,
        namespace: config.temporal.namespace,
        interceptors: [new OpenTelemetryWorkflowClientInterceptor()],
    });
};
