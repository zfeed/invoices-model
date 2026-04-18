import {
    Context,
    Span,
    SpanOptions,
    SpanStatusCode,
    Tracer,
} from '@opentelemetry/api';

export const withSpan = <T>(
    tracer: Tracer,
    name: string,
    fn: (span: Span) => Promise<T>,
    options: SpanOptions = {},
    context?: Context
): Promise<T> => {
    const run = async (span: Span): Promise<T> => {
        try {
            return await fn(span);
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message,
            });
            throw error;
        } finally {
            span.end();
        }
    };

    return context
        ? tracer.startActiveSpan(name, options, context, run)
        : tracer.startActiveSpan(name, options, run);
};
