import pino, { Logger as PinoInstance } from 'pino';
import { Logger, LogContext } from '../../shared/logger/logger';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class PinoLogger extends Logger {
    readonly #pino: PinoInstance;

    constructor(level: LogLevel) {
        super();
        this.#pino = pino({ level });
    }

    debug(message: string, context?: LogContext): void {
        this.#pino.debug(context ?? {}, message);
    }

    info(message: string, context?: LogContext): void {
        this.#pino.info(context ?? {}, message);
    }

    warn(message: string, context?: LogContext): void {
        this.#pino.warn(context ?? {}, message);
    }

    error(message: string, context?: LogContext): void {
        this.#pino.error(context ?? {}, message);
    }
}
