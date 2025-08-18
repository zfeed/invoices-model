import { Currency } from './currency';
import { ZeroDecimalPlaces } from '../decimal-places/zero-decimal-places';

export class JPY implements Currency {
    #decimalPlaces = new ZeroDecimalPlaces();

    public get decimalPlaces() {
        return this.#decimalPlaces;
    }

    equals(other: Currency): boolean {
        return other instanceof JPY;
    }
}
