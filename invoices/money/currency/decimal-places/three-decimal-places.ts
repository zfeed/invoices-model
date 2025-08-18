import { DecimalPlace } from './decimal-place';
import { DECIMAL_PLACES } from '../../../numeric/rounding';

export class ThreeDecimalPlaces implements DecimalPlace {
    readonly value = DECIMAL_PLACES.THREE;
}