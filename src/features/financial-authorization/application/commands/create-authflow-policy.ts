import { Session } from '../../../../shared/unit-of-work/unit-of-work.ts';
import { Action } from '../../domain/action/action.ts';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy.ts';
import { AuthflowTemplate } from '../../domain/authflow/authflow-template.ts';

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
