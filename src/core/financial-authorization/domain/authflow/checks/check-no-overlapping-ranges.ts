import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { AuthflowTemplate } from '../authflow-template';

export function checkNoOverlappingRanges(
    templates: AuthflowTemplate[]
): DomainError | null {
    for (let i = 0; i < templates.length; i++) {
        for (let j = i + 1; j < templates.length; j++) {
            const a = templates[i];
            const b = templates[j];

            if (
                Number(a.range.from.amount) <= Number(b.range.to.amount) &&
                Number(b.range.from.amount) <= Number(a.range.to.amount)
            ) {
                return new DomainError({
                    message:
                        'Authflow policy templates have overlapping ranges',
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP,
                });
            }
        }
    }

    return null;
}
