import { ThreeDecimalPlaces  } from '../decimal-places/three-decimal-places';
import { Currency } from './currency';

export class BHD implements Currency {
    #decimalPlaces = new ThreeDecimalPlaces();

    public get decimalPlaces() {
        return this.#decimalPlaces;
    } 

    equals(other: Currency): boolean {
        return other instanceof BHD;
    }
}
