import { KafkaJS } from '@confluentinc/kafka-javascript';
import { Logger, LogContext } from '../../shared/logger/logger';

export const toKafkaLogger = (
    logger: Logger,
    namespace?: string
): KafkaJS.Logger => {
    const withNamespace = (extra?: object): LogContext => ({
        ...(namespace ? { namespace } : {}),
        ...extra,
    });

    return {
        info: (message, extra) => logger.info(message, withNamespace(extra)),
        error: (message, extra) => logger.error(message, withNamespace(extra)),
        warn: (message, extra) => logger.warn(message, withNamespace(extra)),
        debug: (message, extra) => logger.debug(message, withNamespace(extra)),
        namespace: (childNamespace) =>
            toKafkaLogger(
                logger,
                namespace ? `${namespace}/${childNamespace}` : childNamespace
            ),
        setLogLevel: () => {},
    };
};
