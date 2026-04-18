import { AppKnownError, Mappable, Result } from '../../../../shared/index.ts';
import { DomainEvent } from '../../../bulding-blocks/events/domain-event.ts';
import { PublishableEvents } from '../../../bulding-blocks/events/event-publisher.interface.ts';
import { Action } from '../action/action.ts';
import { Id } from '../id/id.ts';
import { Money } from '../money/money.ts';
import { Authflow } from './authflow.ts';
import { AuthflowTemplate } from './authflow-template.ts';
import { checkNoOverlappingRanges } from './checks/check-no-overlapping-ranges.ts';
import { checkTemplateInRange } from './checks/check-template-in-range.ts';
import { AuthflowPolicyCreatedEvent } from './events/authflow-policy-created.event.ts';

export class AuthflowPolicy
    implements
        Mappable<ReturnType<AuthflowPolicy['toPlain']>>,
        PublishableEvents<DomainEvent<any>>
{
    protected _id: Id;
    protected _action: Action;
    protected _templates: AuthflowTemplate[];
    protected _events: DomainEvent<any>[] = [];

    protected constructor(
        id: Id,
        action: Action,
        templates: AuthflowTemplate[]
    ) {
        this._id = id;
        this._action = action;
        this._templates = templates;
    }

    public get id(): Id {
        return this._id;
    }

    public get action(): Action {
        return this._action;
    }

    public get templates(): AuthflowTemplate[] {
        return this._templates;
    }

    public get events(): DomainEvent<any>[] {
        return this._events;
    }

    static create(data: { action: Action; templates: AuthflowTemplate[] }) {
        const error = checkNoOverlappingRanges(data.templates);
        if (error) {
            return Result.error(error);
        }

        const policy = new AuthflowPolicy(
            Id.create().unwrap(),
            data.action,
            data.templates
        );

        policy._events.push(
            AuthflowPolicyCreatedEvent.create(policy.toPlain())
        );

        return Result.ok(policy);
    }

    selectAuthflow(amount: Money): Result<AppKnownError, Authflow> {
        const rangeError = checkTemplateInRange(this._templates, amount);
        if (rangeError) {
            return Result.error(rangeError);
        }

        const matched = this._templates.find(
            (t) =>
                Number(amount.amount) >= Number(t.range.from.amount) &&
                Number(amount.amount) <= Number(t.range.to.amount)
        )!;

        return matched.toAuthflow(this._action);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            action: this._action.toPlain(),
            templates: this._templates.map((t) => t.toPlain()),
        };
    }
}
