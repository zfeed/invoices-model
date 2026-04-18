import { KNOWN_ERROR_CODE } from '../../../../bulding-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../bulding-blocks/errors/app-known-error.ts';
import { Money } from '../../money/money.ts';
import { AuthflowTemplate } from '../authflow-template.ts';

export function checkTemplateInRange(
    templates: AuthflowTemplate[],
    amount: Money
): AppKnownError | null {
    const found = templates.some(
        (t) =>
            Number(amount.amount) >= Number(t.range.from.amount) &&
            Number(amount.amount) <= Number(t.range.to.amount)
    );

    if (!found) {
        return new AppKnownError({
            code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND,
            message: `No authflow template found for amount ${amount.amount} ${amount.currency}`,
        });
    }

    return null;
}
