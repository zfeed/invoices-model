import { isInt } from 'validator';
import { DomainError, DOMAIN_ERROR_CODE } from '../../../building-blocks';

export function checkUnitQuantity(quantity: string): DomainError | null {
    if (!isInt(quantity)) {
        return new DomainError({
            message: 'Quantity must be an integer, received: ' + quantity,
            code: DOMAIN_ERROR_CODE.LINE_ITEM_NOT_INTEGER_QUANTITY,
        });
    }

    if (Number(quantity) <= 0) {
        return new DomainError({
            message:
                'Quantity must be a positive integer, received: ' + quantity,
            code: DOMAIN_ERROR_CODE.LINE_ITEM_NOT_POSITIVE_QUANTITY,
        });
    }

    return null;
}
