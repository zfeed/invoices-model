import {
    Logger as TemporalLogger,
    LogLevel,
    LogMetadata,
} from '@temporalio/worker';
import { Logger } from '../../shared/logger/logger';

export const toTemporalLogger = (logger: Logger): TemporalLogger => {
    const log = (
        level: LogLevel,
        message: string,
        meta?: LogMetadata
    ): void => {
        switch (level) {
            case 'TRACE':
            case 'DEBUG':
                logger.debug(message, meta);
                return;
            case 'INFO':
                logger.info(message, meta);
                return;
            case 'WARN':
                logger.warn(message, meta);
                return;
            case 'ERROR':
                logger.error(message, meta);
                return;
        }
    };

    return {
        log,
        trace: (message, meta) => log('TRACE', message, meta),
        debug: (message, meta) => log('DEBUG', message, meta),
        info: (message, meta) => log('INFO', message, meta),
        warn: (message, meta) => log('WARN', message, meta),
        error: (message, meta) => log('ERROR', message, meta),
    };
};
