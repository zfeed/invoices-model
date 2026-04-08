export type LogContext = Record<string, unknown>;

export abstract class Logger {
    abstract debug(message: string, context?: LogContext): void;
    abstract info(message: string, context?: LogContext): void;
    abstract warn(message: string, context?: LogContext): void;
    abstract error(message: string, context?: LogContext): void;
}
