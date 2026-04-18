import { Logger as PinoInstance } from 'pino';
import {
    Logger,
    LogContext,
} from '../../../core/building-blocks/logger/logger.ts';

export type LoggerOptions = { pino: PinoInstance };

export class PinoLogger extends Logger {
    readonly #pino: PinoInstance;

    constructor({ pino }: LoggerOptions) {
        super();
        this.#pino = pino;
    }

    trace(message: string, context?: LogContext): void {
        this.#pino.trace(context ?? {}, message);
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
