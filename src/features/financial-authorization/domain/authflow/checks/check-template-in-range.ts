import { DOMAIN_ERROR_CODE } from '../../../../../shared/errors/domain/domain-codes.ts';
import { DomainError } from '../../../../../shared/errors/domain/domain.error.ts';
import { Money } from '../../money/money.ts';
import { AuthflowTemplate } from '../authflow-template.ts';

export function checkTemplateInRange(
    templates: AuthflowTemplate[],
    amount: Money
): DomainError | null {
    const found = templates.some(
        (t) =>
            Number(amount.amount) >= Number(t.range.from.amount) &&
            Number(amount.amount) <= Number(t.range.to.amount)
    );

    if (!found) {
        return new DomainError({
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND,
            message: `No authflow template found for amount ${amount.amount} ${amount.currency}`,
        });
    }

    return null;
}
