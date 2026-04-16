import { TemporalWorker } from '../../worker.ts';
import { Paypal } from '../../features/paypal/api/paypal.ts';
import { Session } from '../../shared/unit-of-work/unit-of-work.ts';
import { Logger } from '../../shared/logger/logger.ts';
import { config } from '../../config.ts';

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
