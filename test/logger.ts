import { createLogger } from '../src/platform/container/dependencies/logger.ts';
import { createPino } from '../src/platform/container/dependencies/pino.ts';
import { getConfig } from '../src/config.ts';
import type { Logger } from '../src/core/building-blocks/logger/logger.ts';

let instance: Logger | undefined;

export const getTestLogger = (): Logger => {
    instance ??= createLogger({ pino: createPino(getConfig().logger) });
    return instance;
};
