import { TwoDecimalPlaces } from '../decimal-places/two-decimal-places';
import { Currency } from './currency';

export class USD implements Currency {
    #decimalPlaces = new TwoDecimalPlaces();

    public get decimalPlaces() {
        return this.#decimalPlaces;
    }

    equals(other: Currency): boolean {
        return other instanceof USD;
    }
}
