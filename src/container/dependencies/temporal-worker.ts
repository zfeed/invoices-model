import { TemporalWorker } from '../../worker';
import { Paypal } from '../../features/paypal/api/paypal';
import { Session } from '../../shared/unit-of-work/unit-of-work';
import { Logger } from '../../shared/logger/logger';
import { config } from '../../config';

export const createTemporalWorker = (
    paypal: Paypal,
    session: Session,
    logger: Logger
): TemporalWorker =>
    new TemporalWorker({
        temporal: {
            nativeConnectionOptions: { address: config.temporal.address },
            namespace: config.temporal.namespace,
            metrics: {
                endpoint: config.otel.metricsEndpoint,
                exportIntervalMs: config.otel.metricsExportIntervalMs,
            },
        },
        paypal,
        session,
        logger,
    });
