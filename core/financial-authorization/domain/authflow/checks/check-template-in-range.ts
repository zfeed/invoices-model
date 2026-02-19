import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Money } from '../../money/money';
import { AuthflowPolicy } from '../authflow-policy';

type SelectAuthflowInput = {
    policy: AuthflowPolicy;
    amount: Money;
};

const amountInRange = (amount: Money, from: string, to: string): boolean =>
    Number(amount.amount) >= Number(from) &&
    Number(amount.amount) <= Number(to);

const noTemplateFound = (data: SelectAuthflowInput): boolean =>
    !data.policy.templates.some((t) =>
        amountInRange(data.amount, t.range.from.amount, t.range.to.amount)
    );

const createNoTemplateFoundError = (data: SelectAuthflowInput) =>
    Result.error(
        new DomainError({
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_TEMPLATE_NOT_FOUND,
            message: `No authflow template found for amount ${data.amount.amount} ${data.amount.currency}`,
        })
    );

export function templateInRange(data: SelectAuthflowInput) {
    return Result.ok<DomainError, SelectAuthflowInput>(data).flatMap(
        ifElse(noTemplateFound, createNoTemplateFoundError, Result.ok)
    );
}
