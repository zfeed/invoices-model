import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { UnitOfWorkFactory } from '../../../../shared/unit-of-work/unit-of-work.interface';
import { Action } from '../../../domain/action/action';
import { AuthflowPolicy } from '../../../domain/authflow/authflow-policy';
import { AuthflowTemplate } from '../../../domain/authflow/authflow-template';

type CreateAuthflowPolicyRequest = {
    action: string;
    templates: AuthflowTemplate[];
};

export class CreateAuthflowPolicy {
    constructor(
        private readonly unitOfWorkFactory: UnitOfWorkFactory,
        private readonly domainEvents: DomainEvents
    ) {}

    public async execute(request: CreateAuthflowPolicyRequest) {
        const action = Action.create(request.action).unwrap();

        const policy = AuthflowPolicy.create({
            action,
            templates: request.templates,
        }).unwrap();

        await this.unitOfWorkFactory.start(async (uow) => {
            await uow.collection(AuthflowPolicy).add(policy);
        });

        await this.domainEvents.publishEvents(policy);

        return policy.toPlain();
    }
}
