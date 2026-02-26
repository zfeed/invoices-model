type ErrorClass = new (...args: any[]) => Error;

class RetryWhile {
    constructor(
        private readonly fn: () => Promise<void>,
        private readonly errorClass: ErrorClass
    ) {}

    async times(maxAttempts: number): Promise<void> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.fn();
                return;
            } catch (error) {
                if (error instanceof this.errorClass && attempt < maxAttempts) {
                    continue;
                }

                throw error;
            }
        }
    }
}

class RetryBuilder {
    constructor(private readonly fn: () => Promise<void>) {}

    while(errorClass: ErrorClass): RetryWhile {
        return new RetryWhile(this.fn, errorClass);
    }
}

export const retry = (fn: () => Promise<void>): RetryBuilder =>
    new RetryBuilder(fn);
