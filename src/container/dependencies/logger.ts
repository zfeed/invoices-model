import { Logger } from '../../shared/logger/logger';
import { PinoLogger } from '../../infrastructure/logger/pino-logger';
import { config } from '../../config';

export const createLogger = (): Logger => new PinoLogger(config.logger.level);
