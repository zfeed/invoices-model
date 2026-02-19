import { ifElse } from 'ramda';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { Action } from '../../action/action';
import { AuthflowTemplate } from '../authflow-template';

type AuthflowPolicyInput = {
    action: Action;
    templates: AuthflowTemplate[];
};

const rangesOverlap = (a: AuthflowTemplate, b: AuthflowTemplate): boolean =>
    Number(a.range.from.amount) <= Number(b.range.to.amount) &&
    Number(b.range.from.amount) <= Number(a.range.to.amount);

const hasOverlappingRanges = (data: AuthflowPolicyInput): boolean => {
    const { templates } = data;
    for (let i = 0; i < templates.length; i++) {
        for (let j = i + 1; j < templates.length; j++) {
            if (rangesOverlap(templates[i], templates[j])) {
                return true;
            }
        }
    }
    return false;
};

const createOverlappingRangesError = () =>
    Result.error(
        new DomainError({
            message: 'Authflow policy templates have overlapping ranges',
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP,
        })
    );

export function noOverlappingRanges(data: AuthflowPolicyInput) {
    return Result.ok<DomainError, AuthflowPolicyInput>(data).flatMap(
        ifElse(hasOverlappingRanges, createOverlappingRangesError, Result.ok)
    );
}
