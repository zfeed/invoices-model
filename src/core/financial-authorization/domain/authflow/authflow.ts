import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../building-blocks';
import { Action } from '../action/action';
import { Approval } from '../approval/approval';
import { Id } from '../id/id';
import { Range } from '../range/range';
import { Step } from '../step/step';
import { checkNoDuplicateStepOrders } from './checks/check-no-duplicate-step-orders';

export class Authflow implements Mappable<ReturnType<Authflow['toPlain']>> {
    #id: Id;
    #action: Action;
    #range: Range;
    #steps: Step[];
    #currentStep: Step | undefined;

    protected constructor(id: Id, action: Action, range: Range, steps: Step[]) {
        this.#id = id;
        this.#action = action;
        this.#range = range;
        this.#steps = [...steps].sort(
            (a, b) => a.order.toPlain() - b.order.toPlain()
        );
        this.#currentStep = this.#steps.find((s) => !s.isApproved);
    }

    public get id(): Id {
        return this.#id;
    }

    public get action(): Action {
        return this.#action;
    }

    public get range(): Range {
        return this.#range;
    }

    public get isApproved(): boolean {
        return this.#currentStep === undefined;
    }

    public get steps(): readonly Step[] {
        return this.#steps;
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

    static fromPlain(plain: {
        id: string;
        action: string;
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
                approvals: {
                    approverId: string;
                    createdAt: string;
                    comment: string | null;
                }[];
            }[];
        }[];
    }) {
        return new Authflow(
            Id.fromPlain(plain.id),
            Action.fromPlain(plain.action),
            Range.fromPlain(plain.range),
            plain.steps.map((s) => Step.fromPlain(s))
        );
    }

    apply(approval: Approval): Result<DomainError, Authflow> {
        if (!this.#currentStep) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                    message: 'No pending steps found',
                })
            );
        }

        const stepResult = this.#currentStep.apply(approval);

        if (stepResult.isError()) {
            return Result.error(stepResult.unwrapError());
        }

        const updatedSteps = this.#steps.map((s) =>
            s.order.equals(this.#currentStep!.order) ? stepResult.unwrap() : s
        );

        const error = checkNoDuplicateStepOrders(updatedSteps);
        if (error) {
            return Result.error(error);
        }

        return Result.ok(
            new Authflow(this.#id, this.#action, this.#range, updatedSteps)
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        if (!this.#currentStep) {
            return false;
        }

        return this.#currentStep.hasEligibleApprover(approverId);
    }

    canApproverApprove(approverId: Id): boolean {
        if (this.isApproved) {
            return false;
        }

        return this.hasEligibleApprover(approverId);
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            action: this.#action.toPlain(),
            range: this.#range.toPlain(),
            isApproved: this.isApproved,
            steps: this.#steps.map((s) => s.toPlain()),
        };
    }
}
