import { Numeric } from './numeric';
export class VatRate {
    #value: Numeric;

    public get value(): Numeric {
        return this.#value;
    }

    private constructor(value: Numeric) {
        this.#value = value;
    }

    equals(other: VatRate): boolean {
        return this.#value.equals(other.value);
    }

    static fromPercent(value: string) {
        return new VatRate(Numeric.fromString(String(Number(value) / 100)));
    }
}
