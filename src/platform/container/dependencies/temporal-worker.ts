import { TemporalWorker } from '../../worker.ts';
import { Paypal } from '../../../lib/paypal/paypal.ts';
import { Session } from '../../../core/building-blocks/unit-of-work/unit-of-work.ts';
import { Logger } from '../../../core/building-blocks/logger/logger.ts';
import { Config } from '../../../config.ts';

export const createTemporalWorker = (
    paypal: Paypal,
    session: Session,
    logger: Logger,
    config: Config
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
