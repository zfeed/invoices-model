import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Money } from '../../money/money';
import { AuthflowTemplate } from '../authflow-template';

export function checkTemplateInRange(templates: AuthflowTemplate[], amount: Money): DomainError | null {
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
