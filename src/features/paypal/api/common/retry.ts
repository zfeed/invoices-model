import { Duration } from '../../../../lib/dayjs';

export type RetryConfig = {
    maxRetries: number;
    initialDelay: Duration;
    backoffCoefficient: number;
    maxDelay: Duration;
};

export class Retry {
    private readonly maxAttempts: number;
    private readonly initialDelayMs: number;
    private readonly backoffCoefficient: number;
    private readonly maxDelayMs: number;

    constructor(private readonly config: RetryConfig) {
        this.maxAttempts = config.maxRetries + 1;
        this.initialDelayMs = config.initialDelay.asMilliseconds();
        this.backoffCoefficient = config.backoffCoefficient;
        this.maxDelayMs = config.maxDelay.asMilliseconds();
    }

    async execute<T>(
        fn: () => Promise<T>,
        shouldRetry: (result: T) => boolean
    ): Promise<T> {
        let result = await fn();

        for (let attempt = 1; attempt < this.maxAttempts; attempt++) {
            if (!shouldRetry(result)) {
                return result;
            }

            const delay = Math.min(
                this.initialDelayMs * this.backoffCoefficient ** (attempt - 1),
                this.maxDelayMs
            );
            await new Promise((resolve) => setTimeout(resolve, delay));

            result = await fn();
        }

        return result;
    }
}
