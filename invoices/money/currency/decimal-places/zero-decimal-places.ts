import { DecimalPlace } from './decimal-place';
import { DECIMAL_PLACES } from '../../../numeric/rounding';

export class ZeroDecimalPlaces implements DecimalPlace {
    readonly value = DECIMAL_PLACES.ZERO;
}