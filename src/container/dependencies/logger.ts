import { Logger } from '../../shared/logger/logger';
import {
    PinoLogger,
    LoggerOptions,
} from '../../infrastructure/logger/pino-logger';

export const createLogger = (loggerOptions: LoggerOptions): Logger =>
    new PinoLogger(loggerOptions);
