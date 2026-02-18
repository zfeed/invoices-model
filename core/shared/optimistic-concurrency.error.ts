export class OptimisticConcurrencyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OptimisticConcurrencyError';
    }
}
