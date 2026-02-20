import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import {
    AuthflowPolicy,
    AuthflowPolicyInput,
    createAuthflowPolicy,
} from '../../../domain/authflow/authflow-policy';
import { PolicyStorage } from '../../storage/policy-storage.interface';

export const createAuthflowPolicyCommand =
    (policyStorage: PolicyStorage, domainEvents: DomainEvents) =>
    async (request: AuthflowPolicyInput): Promise<Result<DomainError, AuthflowPolicy>> => {
        const result = createAuthflowPolicy(request);

        if (result.isError()) {
            return result.error();
        }

        const policy = result.unwrap();
        const saved = await policyStorage.save(policy).run();

        await domainEvents.publishEvents(policy);

        return saved;
    };
