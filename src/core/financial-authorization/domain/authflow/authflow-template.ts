import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { Action } from '../action/action';
import { Id } from '../id/id';
import { Range } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { Authflow } from './authflow';
import { checkTemplateNoDuplicateStepOrders } from './checks/check-template-no-duplicate-step-orders';

export class AuthflowTemplate implements Mappable<ReturnType<AuthflowTemplate['toPlain']>> {
    #id: Id;
    #range: Range;
    #steps: StepTemplate[];

    protected constructor(id: Id, range: Range, steps: StepTemplate[]) {
        this.#id = id;
        this.#range = range;
        this.#steps = steps;
    }

    public get id(): Id {
        return this.#id;
    }

    public get range(): Range {
        return this.#range;
    }

    public get steps(): readonly StepTemplate[] {
        return this.#steps;
    }

    static create(data: { range: Range; steps: StepTemplate[] }) {
        const error = checkTemplateNoDuplicateStepOrders(data.steps);
        if (error) {
            return Result.error(error);
        }

        return Result.ok(new AuthflowTemplate(Id.create().unwrap(), data.range, data.steps));
    }

    static fromPlain(plain: {
        id: string;
        range: { from: { amount: string; currency: string }; to: { amount: string; currency: string } };
        steps: {
            id: string;
            order: number;
            groups: {
                id: string;
                requiredApprovals: number;
                approvers: { id: string; name: string; email: string }[];
            }[];
        }[];
    }) {
        return new AuthflowTemplate(
            Id.fromPlain(plain.id),
            Range.fromPlain(plain.range),
            plain.steps.map((s) => StepTemplate.fromPlain(s)),
        );
    }

    toAuthflow(action: Action): Result<DomainError, Authflow> {
        const stepsResult = this.#steps.reduce<Result<DomainError, import('../step/step').Step[]>>(
            (acc, template) =>
                acc.flatMap((steps) =>
                    template.toStep().map((step) => [...steps, step])
                ),
            Result.ok([])
        );

        return stepsResult.flatMap((steps) =>
            Authflow.create({ action, range: this.#range, steps })
        );
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            range: this.#range.toPlain(),
            steps: this.#steps.map((s) => s.toPlain()),
        };
    }
}
