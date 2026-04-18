import { Logger } from '../../../core/building-blocks/logger/logger.ts';
import {
    PinoLogger,
    LoggerOptions,
} from '../../infrastructure/logger/pino-logger.ts';

export const createLogger = (loggerOptions: LoggerOptions): Logger =>
    new PinoLogger(loggerOptions);
