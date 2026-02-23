import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { createAction } from '../../../domain/action/action';
import {
    authflowPolicyToPlain,
    createAuthflowPolicy,
    PlainAuthflowPolicy,
} from '../../../domain/authflow/authflow-policy';
import { AuthflowTemplate } from '../../../domain/authflow/authflow-template';
import { PolicyStorage } from '../../storage/policy-storage.interface';

type CreateAuthflowPolicyRequest = {
    action: string;
    templates: AuthflowTemplate[];
};

export const createAuthflowPolicyCommand =
    (policyStorage: PolicyStorage, domainEvents: DomainEvents) =>
    async (request: CreateAuthflowPolicyRequest): Promise<PlainAuthflowPolicy> => {
        const action = createAction(request.action).unwrap();

        const policy = createAuthflowPolicy({
            action,
            templates: request.templates,
        }).unwrap();

        const saved = await policyStorage.save(policy).run();

        await domainEvents.publishEvents(policy);

        return saved.map(authflowPolicyToPlain).unwrap();
    };
