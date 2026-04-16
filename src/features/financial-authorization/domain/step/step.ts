import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../shared/index.ts';
import { Approval } from '../approval/approval.ts';
import { Group } from '../groups/group.ts';
import { Id } from '../id/id.ts';
import { Order } from '../order/order.ts';

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
