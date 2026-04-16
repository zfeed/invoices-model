import { DOMAIN_ERROR_CODE, DomainError } from '../../../../../../shared/index.ts';

export function checkDescriptionNonEmpty(value: string): DomainError | null {
    if (value.trim().length === 0) {
        return new DomainError({
            message: 'Description must not be empty',
            code: DOMAIN_ERROR_CODE.LINE_ITEM_EMPTY_DESCRIPTION,
        });
    }

    return null;
}
