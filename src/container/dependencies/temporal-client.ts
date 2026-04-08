import { Connection, WorkflowClient } from '@temporalio/client';
import { config } from '../../config';

export const createTemporalClient = async (): Promise<WorkflowClient> => {
    const connection = await Connection.connect({
        address: config.temporal.address,
    });
    return new WorkflowClient({
        connection,
        namespace: config.temporal.namespace,
    });
};
