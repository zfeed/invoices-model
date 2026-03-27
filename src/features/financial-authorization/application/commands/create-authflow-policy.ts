import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { Action } from '../../domain/action/action';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template';

type CreateAuthflowPolicyRequest = {
    action: string;
    templates: AuthflowTemplate[];
};

export class CreateAuthflowPolicy {
    constructor(private readonly session: Session) {}

    public async execute(request: CreateAuthflowPolicyRequest) {
        const action = Action.create(request.action).unwrap();

        const policy = AuthflowPolicy.create({
            action,
            templates: request.templates,
        }).unwrap();

        {
            await using uow = await this.session.begin();
            await uow.collection(AuthflowPolicy).add(policy);
            await uow.commit();
        }

        return policy.toPlain();
    }
}
