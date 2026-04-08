import { TemporalWorker } from '../../worker';
import { Paypal } from '../../features/paypal/api/paypal';
import { Session } from '../../shared/unit-of-work/unit-of-work';
import { config } from '../../config';

export const createTemporalWorker = (
    paypal: Paypal,
    session: Session
): TemporalWorker =>
    new TemporalWorker({
        temporal: {
            nativeConnectionOptions: { address: config.temporal.address },
        },
        paypal,
        session,
    });
