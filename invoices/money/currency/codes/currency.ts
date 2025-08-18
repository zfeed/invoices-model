import { DecimalPlace } from '../decimal-places/decimal-place';

export interface Currency {
     readonly decimalPlaces: DecimalPlace;

     equals(other: Currency): boolean;
}