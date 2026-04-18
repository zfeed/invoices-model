import validator from 'validator';
import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../../shared/index.ts';

export function checkUnitQuantity(quantity: string): AppKnownError | null {
    if (!validator.isInt(quantity)) {
        return new AppKnownError({
            message: 'Quantity must be an integer, received: ' + quantity,
            code: KNOWN_ERROR_CODE.LINE_ITEM_NOT_INTEGER_QUANTITY,
        });
    }

    if (Number(quantity) <= 0) {
        return new AppKnownError({
            message:
                'Quantity must be a positive integer, received: ' + quantity,
            code: KNOWN_ERROR_CODE.LINE_ITEM_NOT_POSITIVE_QUANTITY,
        });
    }

    return null;
}
