export type LogContext = object;
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export abstract class Logger {
    log(level: LogLevel, message: string, context?: LogContext): void {
        const dispatch: Record<LogLevel, (m: string, c?: LogContext) => void> =
            {
                TRACE: (m, c) => this.trace(m, c),
                DEBUG: (m, c) => this.debug(m, c),
                INFO: (m, c) => this.info(m, c),
                WARN: (m, c) => this.warn(m, c),
                ERROR: (m, c) => this.error(m, c),
            };
        dispatch[level](message, context);
    }

    abstract trace(message: string, context?: LogContext): void;
    abstract debug(message: string, context?: LogContext): void;
    abstract info(message: string, context?: LogContext): void;
    abstract warn(message: string, context?: LogContext): void;
    abstract error(message: string, context?: LogContext): void;
}
