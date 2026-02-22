import { isBIC } from 'validator';
import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../../building-blocks';

export function checkSwift(value: string): DomainError | null {
    if (!isBIC(value)) {
        return new DomainError({
            message: 'Expected a valid SWIFT/BIC code, but received: ' + value,
            code: DOMAIN_ERROR_CODE.WIRE_INVALID_SWIFT,
        });
    }

    return null;
}
