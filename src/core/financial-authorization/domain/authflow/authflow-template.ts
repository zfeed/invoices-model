import {
    AppKnownError,
    Mappable,
    Result,
} from '../../../building-blocks/index.ts';
import { Action } from '../action/action.ts';
import { Id } from '../id/id.ts';
import { Range } from '../range/range.ts';
import { StepTemplate } from '../step/step-template.ts';
import { Authflow } from './authflow.ts';
import { checkTemplateNoDuplicateStepOrders } from './checks/check-template-no-duplicate-step-orders.ts';

export class AuthflowTemplate implements Mappable<
    ReturnType<AuthflowTemplate['toPlain']>
> {
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

    toAuthflow(action: Action): Result<AppKnownError, Authflow> {
        const stepsResult = this._steps.reduce<
            Result<AppKnownError, import('../step/step.ts').Step[]>
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
