import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { DomainEvent } from '../../../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../../../building-blocks/events/event-publisher.interface';
import { Action } from '../action/action';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { Authflow } from './authflow';
import { AuthflowTemplate } from './authflow-template';
import { checkNoOverlappingRanges } from './checks/check-no-overlapping-ranges';
import { checkTemplateInRange } from './checks/check-template-in-range';
import { AuthflowPolicyCreatedEvent } from './events/authflow-policy-created.event';

export class AuthflowPolicy implements Mappable<ReturnType<AuthflowPolicy['toPlain']>>, PublishableEvents<DomainEvent<any>> {
    #id: Id;
    #action: Action;
    #templates: AuthflowTemplate[];
    #events: DomainEvent<any>[] = [];

    protected constructor(id: Id, action: Action, templates: AuthflowTemplate[]) {
        this.#id = id;
        this.#action = action;
        this.#templates = templates;
    }

    public get id(): Id {
        return this.#id;
    }

    public get action(): Action {
        return this.#action;
    }

    public get templates(): readonly AuthflowTemplate[] {
        return this.#templates;
    }

    public get events(): ReadonlyArray<DomainEvent<any>> {
        return this.#events;
    }

    static create(data: { action: Action; templates: AuthflowTemplate[] }) {
        const error = checkNoOverlappingRanges(data.templates);
        if (error) {
            return Result.error(error);
        }

        const policy = new AuthflowPolicy(
            Id.create().unwrap(),
            data.action,
            data.templates,
        );

        policy.#events.push(new AuthflowPolicyCreatedEvent(policy.toPlain()));

        return Result.ok(policy);
    }

    static fromPlain(plain: {
        id: string;
        action: string;
        templates: {
            id: string;
            range: { from: { amount: string; currency: string }; to: { amount: string; currency: string } };
            steps: {
                id: string;
                order: number;
                groups: {
                    id: string;
                    approvers: { id: string; name: string; email: string }[];
                }[];
            }[];
        }[];
    }) {
        return new AuthflowPolicy(
            Id.fromPlain(plain.id),
            Action.fromPlain(plain.action),
            plain.templates.map((t) => AuthflowTemplate.fromPlain(t)),
        );
    }

    selectAuthflow(amount: Money): Result<DomainError, Authflow> {
        const rangeError = checkTemplateInRange(this.#templates, amount);
        if (rangeError) {
            return Result.error(rangeError);
        }

        const matched = this.#templates.find(
            (t) =>
                Number(amount.amount) >= Number(t.range.from.amount) &&
                Number(amount.amount) <= Number(t.range.to.amount)
        )!;

        return matched.toAuthflow(this.#action);
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            action: this.#action.toPlain(),
            templates: this.#templates.map((t) => t.toPlain()),
        };
    }
}
