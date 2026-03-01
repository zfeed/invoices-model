import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../building-blocks';
import { Approval } from '../approval/approval';
import { Group } from '../groups/group';
import { Id } from '../id/id';
import { Order } from '../order/order';

export class Step implements Mappable<ReturnType<Step['toPlain']>> {
    protected _id: Id;
    protected _order: Order;
    protected _isApproved: boolean;
    protected _groups: Group[];

    protected constructor(
        id: Id,
        order: Order,
        isApproved: boolean,
        groups: Group[]
    ) {
        this._id = id;
        this._order = order;
        this._isApproved = isApproved;
        this._groups = groups;
    }

    public get id(): Id {
        return this._id;
    }

    public get order(): Order {
        return this._order;
    }

    public get isApproved(): boolean {
        return this._isApproved;
    }

    public get groups(): Group[] {
        return this._groups;
    }

    static create(data: { order: Order; groups: Group[] }) {
        return Result.ok(
            new Step(
                Id.create().unwrap(),
                data.order,
                data.groups.every((g) => g.isApproved),
                data.groups
            )
        );
    }

    static fromPlain(plain: {
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
    }) {
        const groups = plain.groups.map((g) => Group.fromPlain(g));
        return new Step(
            Id.fromPlain(plain.id),
            Order.fromPlain(plain.order),
            groups.every((g) => g.isApproved),
            groups
        );
    }

    apply(approval: Approval): Result<DomainError, Step> {
        if (this._isApproved) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                    message: 'No pending steps found',
                })
            );
        }

        const groupIndex = this._groups.findIndex((g) =>
            g.hasEligibleApprover(approval.approverId)
        );

        if (groupIndex === -1) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approval.approverId.toPlain()}`,
                })
            );
        }

        const groupResult = this._groups[groupIndex].apply(approval);

        if (groupResult.isError()) {
            return Result.error(groupResult.unwrapError());
        }

        const updatedGroups = this._groups.map((g, i) =>
            i === groupIndex ? groupResult.unwrap() : g
        );

        return Result.ok(
            new Step(
                this._id,
                this._order,
                updatedGroups.every((g) => g.isApproved),
                updatedGroups
            )
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        return (
            !this._isApproved &&
            this._groups.some((g) => g.hasEligibleApprover(approverId))
        );
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            order: this._order.toPlain(),
            isApproved: this._isApproved,
            groups: this._groups.map((g) => g.toPlain()),
        };
    }
}
