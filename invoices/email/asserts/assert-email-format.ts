import { isEmail } from 'validator';
import { DomainError, DOMAIN_ERROR_CODE } from "../../../building-blocks";

export function assertEmailFormat(value: string): DomainError | null {
    if (!isEmail(value)) {
        return new DomainError({
            message: "Expected a valid email format, but received: " + value,
            code: DOMAIN_ERROR_CODE.EMAIL_INVALID_FORMAT,
        });
    }

    return null;
}
