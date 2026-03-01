import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { Action } from '../action/action';
import { Id } from '../id/id';
import { Range } from '../range/range';
import { StepTemplate } from '../step/step-template';
import { Authflow } from './authflow';
import { checkTemplateNoDuplicateStepOrders } from './checks/check-template-no-duplicate-step-orders';

export class AuthflowTemplate
    implements Mappable<ReturnType<AuthflowTemplate['toPlain']>>
{
    protected _id: Id;
    protected _range: Range;
    protected _steps: StepTemplate[];

    protected constructor(id: Id, range: Range, steps: StepTemplate[]) {
        this._id = id;
        this._range = range;
        this._steps = steps;
    }

    public get id(): Id {
        return this._id;
    }

    public get range(): Range {
        return this._range;
    }

    public get steps(): StepTemplate[] {
        return this._steps;
    }

    static create(data: { range: Range; steps: StepTemplate[] }) {
        const error = checkTemplateNoDuplicateStepOrders(data.steps);
        if (error) {
            return Result.error(error);
        }

        return Result.ok(
            new AuthflowTemplate(Id.create().unwrap(), data.range, data.steps)
        );
    }

    static fromPlain(plain: {
        id: string;
        range: {
            from: { amount: string; currency: string };
            to: { amount: string; currency: string };
        };
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
            plain.steps.map((s) => StepTemplate.fromPlain(s))
        );
    }

    toAuthflow(action: Action): Result<DomainError, Authflow> {
        const stepsResult = this._steps.reduce<
            Result<DomainError, import('../step/step').Step[]>
        >(
            (acc, template) =>
                acc.flatMap((steps) =>
                    template.toStep().map((step) => [...steps, step])
                ),
            Result.ok([])
        );

        return stepsResult.flatMap((steps) =>
            Authflow.create({ action, range: this._range, steps })
        );
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            range: this._range.toPlain(),
            steps: this._steps.map((s) => s.toPlain()),
        };
    }
}
