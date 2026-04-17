import {
    KNOWN_ERROR_CODE,
    AppKnownError,
    Mappable,
    Result,
} from '../../../../shared/index.ts';
import { Action } from '../action/action.ts';
import { Approval } from '../approval/approval.ts';
import { Id } from '../id/id.ts';
import { Range } from '../range/range.ts';
import { Step } from '../step/step.ts';
import { checkNoDuplicateStepOrders } from './checks/check-no-duplicate-step-orders.ts';

export class Authflow implements Mappable<ReturnType<Authflow['toPlain']>> {
    protected _id: Id;
    protected _action: Action;
    protected _range: Range;
    protected _steps: Step[];
    protected _currentStep: Step | undefined;

    protected constructor(id: Id, action: Action, range: Range, steps: Step[]) {
        this._id = id;
        this._action = action;
        this._range = range;
        this._steps = [...steps].sort(
            (a, b) => a.order.toPlain() - b.order.toPlain()
        );
        this._currentStep = this._steps.find((s) => !s.isApproved);
    }

    public get id(): Id {
        return this._id;
    }

    public get action(): Action {
        return this._action;
    }

    public get range(): Range {
        return this._range;
    }

    public get steps(): Step[] {
        return this._steps;
    }

    public get isApproved(): boolean {
        return this._currentStep === undefined;
    }

    static create(data: { action: Action; range: Range; steps: Step[] }) {
        const error = checkNoDuplicateStepOrders(data.steps);
        if (error) {
            return Result.error(error);
        }

        return Result.ok(
            new Authflow(
                Id.create().unwrap(),
                data.action,
                data.range,
                data.steps
            )
        );
    }

    apply(approval: Approval): Result<AppKnownError, Authflow> {
        if (!this._currentStep) {
            return Result.error(
                new AppKnownError({
                    code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                    message: 'No pending steps found',
                })
            );
        }

        const stepResult = this._currentStep.apply(approval);

        if (stepResult.isError()) {
            return Result.error(stepResult.unwrapError());
        }

        const updatedSteps = this._steps.map((s) =>
            s.order.equals(this._currentStep!.order) ? stepResult.unwrap() : s
        );

        const error = checkNoDuplicateStepOrders(updatedSteps);
        if (error) {
            return Result.error(error);
        }

        return Result.ok(
            new Authflow(this._id, this._action, this._range, updatedSteps)
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        if (!this._currentStep) {
            return false;
        }

        return this._currentStep.hasEligibleApprover(approverId);
    }

    canApproverApprove(approverId: Id): boolean {
        if (this.isApproved) {
            return false;
        }

        return this.hasEligibleApprover(approverId);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            action: this._action.toPlain(),
            range: this._range.toPlain(),
            isApproved: this.isApproved,
            steps: this._steps.map((s) => s.toPlain()),
        };
    }
}
