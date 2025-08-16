import { DecimalPlace } from './decimal-place';
import { DECIMAL_PLACES } from '../../../numeric/rounding';

export class TwoDecimalPlaces implements DecimalPlace {
    readonly value = DECIMAL_PLACES.TWO;
}