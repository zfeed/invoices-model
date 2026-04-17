import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../../shared/errors/app-known-error.ts';
import { AuthflowTemplate } from '../authflow-template.ts';

export function checkNoOverlappingRanges(
    templates: AuthflowTemplate[]
): AppKnownError | null {
    for (let i = 0; i < templates.length; i++) {
        for (let j = i + 1; j < templates.length; j++) {
            const a = templates[i];
            const b = templates[j];

            if (
                Number(a.range.from.amount) <= Number(b.range.to.amount) &&
                Number(b.range.from.amount) <= Number(a.range.to.amount)
            ) {
                return new AppKnownError({
                    message:
                        'Authflow policy templates have overlapping ranges',
                    code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP,
                });
            }
        }
    }

    return null;
}
