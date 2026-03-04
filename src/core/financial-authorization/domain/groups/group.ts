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
    protected _id: Id;
    protected _requiredApprovals: number;
    protected _approvers: Approver[];
    protected _approvals: Approval[];

    protected constructor(
        id: Id,
        requiredApprovals: number,
        approvers: Approver[],
        approvals: Approval[]
    ) {
        this._id = id;
        this._requiredApprovals = requiredApprovals;
        this._approvers = approvers;
        this._approvals = approvals;
    }

    public get id(): Id {
        return this._id;
    }

    public get requiredApprovals(): number {
        return this._requiredApprovals;
    }

    public get approvers(): Approver[] {
        return this._approvers;
    }

    public get approvals(): Approval[] {
        return this._approvals;
    }

    public get isApproved(): boolean {
        return this._approvals.length >= this._requiredApprovals;
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

    apply(approval: Approval): Result<DomainError, Group> {
        if (this.isApproved) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approval.approverId.toPlain()}`,
                })
            );
        }

        if (!this._approvers.some((a) => a.id.equals(approval.approverId))) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approval.approverId.toPlain()}`,
                })
            );
        }

        const newApprovals = [...this._approvals, approval];

        const approversEmptyError = checkApproversNotEmpty(this._approvers);
        if (approversEmptyError) {
            return Result.error(approversEmptyError);
        }

        const duplicateApproversError = checkNoDuplicateApprovers(
            this._approvers
        );
        if (duplicateApproversError) {
            return Result.error(duplicateApproversError);
        }

        const approverExistsError = checkApproverExists(
            this._approvers,
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
                this._id,
                this._requiredApprovals,
                this._approvers,
                newApprovals
            )
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        return (
            !this.isApproved &&
            this._approvers.some((a) => a.id.equals(approverId))
        );
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            requiredApprovals: this._requiredApprovals,
            isApproved: this.isApproved,
            approvers: this._approvers.map((a) => a.toPlain()),
            approvals: this._approvals.map((a) => a.toPlain()),
        };
    }
}
