import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { createAction } from '../../../domain/action/action';
import {
    AuthflowPolicy,
    createAuthflowPolicy,
} from '../../../domain/authflow/authflow-policy';
import { AuthflowTemplate } from '../../../domain/authflow/authflow-template';
import { PolicyStorage } from '../../storage/policy-storage.interface';

type CreateAuthflowPolicyRequest = {
    action: string;
    templates: AuthflowTemplate[];
};

export const createAuthflowPolicyCommand =
    (policyStorage: PolicyStorage, domainEvents: DomainEvents) =>
    async (request: CreateAuthflowPolicyRequest): Promise<Result<DomainError, AuthflowPolicy>> => {
        const actionResult = createAction(request.action);
        if (actionResult.isError()) {
            return Result.error(actionResult.unwrapError());
        }
        const action = actionResult.unwrap();

        const result = createAuthflowPolicy({
            action,
            templates: request.templates,
        });

        if (result.isError()) {
            return result.error();
        }

        const policy = result.unwrap();
        const saved = await policyStorage.save(policy).run();

        await domainEvents.publishEvents(policy);

        return saved;
    };
