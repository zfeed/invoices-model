export class Currency {
    private constructor(public value: string) {}

    static fromISO4217(code: string) {
        return new Currency(code);
    }

    equals(currency: Currency) {
        return this.value === currency.value;
    }
}
