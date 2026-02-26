import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../building-blocks';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Id } from '../id/id';
import { checkApproversNotEmpty } from './checks/check-approvers-not-empty';
import { checkNoDuplicateApprovers } from './checks/check-no-duplicate-approvers';
import { checkApproverExists } from './checks/check-approver-exists';
import { checkNoDuplicateApprovals } from './checks/check-no-duplicate-approvals';

export class Group implements Mappable<ReturnType<Group['toPlain']>> {
    #id: Id;
    #requiredApprovals: number;
    #approvers: Approver[];
    #approvals: Approval[];

    protected constructor(
        id: Id,
        requiredApprovals: number,
        approvers: Approver[],
        approvals: Approval[]
    ) {
        this.#id = id;
        this.#requiredApprovals = requiredApprovals;
        this.#approvers = approvers;
        this.#approvals = approvals;
    }

    public get id(): Id {
        return this.#id;
    }

    public get requiredApprovals(): number {
        return this.#requiredApprovals;
    }

    public get isApproved(): boolean {
        return this.#approvals.length >= this.#requiredApprovals;
    }

    public get approvers(): readonly Approver[] {
        return this.#approvers;
    }

    public get approvals(): readonly Approval[] {
        return this.#approvals;
    }

    static create(data: {
        requiredApprovals: number;
        approvers: Approver[];
        approvals: Approval[];
    }) {
        const approversEmptyError = checkApproversNotEmpty(data.approvers);
        if (approversEmptyError) {
            return Result.error(approversEmptyError);
        }

        const duplicateApproversError = checkNoDuplicateApprovers(
            data.approvers
        );
        if (duplicateApproversError) {
            return Result.error(duplicateApproversError);
        }

        const approverExistsError = checkApproverExists(
            data.approvers,
            data.approvals
        );
        if (approverExistsError) {
            return Result.error(approverExistsError);
        }

        const duplicateApprovalsError = checkNoDuplicateApprovals(
            data.approvals
        );
        if (duplicateApprovalsError) {
            return Result.error(duplicateApprovalsError);
        }

        return Result.ok(
            new Group(
                Id.create().unwrap(),
                data.requiredApprovals,
                data.approvers,
                data.approvals
            )
        );
    }

    static fromPlain(plain: {
        id: string;
        requiredApprovals: number;
        approvers: { id: string; name: string; email: string }[];
        approvals: {
            approverId: string;
            createdAt: string;
            comment: string | null;
        }[];
    }) {
        return new Group(
            Id.fromPlain(plain.id),
            plain.requiredApprovals,
            plain.approvers.map((a) => Approver.fromPlain(a)),
            plain.approvals.map((a) => Approval.fromPlain(a))
        );
    }

    apply(approval: Approval): Result<DomainError, Group> {
        if (this.isApproved) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approval.approverId.toPlain()}`,
                })
            );
        }

        if (!this.#approvers.some((a) => a.id.equals(approval.approverId))) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approval.approverId.toPlain()}`,
                })
            );
        }

        const newApprovals = [...this.#approvals, approval];

        const approversEmptyError = checkApproversNotEmpty(this.#approvers);
        if (approversEmptyError) {
            return Result.error(approversEmptyError);
        }

        const duplicateApproversError = checkNoDuplicateApprovers(
            this.#approvers
        );
        if (duplicateApproversError) {
            return Result.error(duplicateApproversError);
        }

        const approverExistsError = checkApproverExists(
            this.#approvers,
            newApprovals
        );
        if (approverExistsError) {
            return Result.error(approverExistsError);
        }

        const duplicateApprovalsError = checkNoDuplicateApprovals(newApprovals);
        if (duplicateApprovalsError) {
            return Result.error(duplicateApprovalsError);
        }

        return Result.ok(
            new Group(
                this.#id,
                this.#requiredApprovals,
                this.#approvers,
                newApprovals
            )
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        return (
            !this.isApproved &&
            this.#approvers.some((a) => a.id.equals(approverId))
        );
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            requiredApprovals: this.#requiredApprovals,
            isApproved: this.isApproved,
            approvers: this.#approvers.map((a) => a.toPlain()),
            approvals: this.#approvals.map((a) => a.toPlain()),
        };
    }
}
