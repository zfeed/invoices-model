import { Money } from './money/money';
import { Numeric } from './numeric/numeric';
import { ROUNDING, DECIMAL_PLACES } from './numeric/rounding';
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
        const oneHundred = Numeric.fromString('100');
        const percents = Numeric.fromString(value);

        const numericValue = percents.divideBy(oneHundred).toDecimalPlaces(DECIMAL_PLACES.TWO, ROUNDING.UP);

        return new VatRate(numericValue);
    }

    applyTo(money: Money): Money {
        const result = money.amount.value.multiplyBy(this.value);
        const roundedAccordingToCurrency = result.toDecimalPlaces(money.currency.decimalPlaces.value, ROUNDING.UP);

        return money.add(roundedAccordingToCurrency);
    }
}
