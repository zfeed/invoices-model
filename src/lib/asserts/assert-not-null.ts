export function assertNotNull<T>(value: T): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
        throw new Error(
            `Expected value to be non-null, received ${JSON.stringify(value)}`
        );
    }
}
