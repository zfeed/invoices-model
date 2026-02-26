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
    #id: Id;
    #order: Order;
    #isApproved: boolean;
    #groups: Group[];

    protected constructor(
        id: Id,
        order: Order,
        isApproved: boolean,
        groups: Group[]
    ) {
        this.#id = id;
        this.#order = order;
        this.#isApproved = isApproved;
        this.#groups = groups;
    }

    public get id(): Id {
        return this.#id;
    }

    public get order(): Order {
        return this.#order;
    }

    public get isApproved(): boolean {
        return this.#isApproved;
    }

    public get groups(): readonly Group[] {
        return this.#groups;
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
        if (this.isApproved) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                    message: 'No pending steps found',
                })
            );
        }

        const groupIndex = this.#groups.findIndex((g) =>
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

        const groupResult = this.#groups[groupIndex].apply(approval);

        if (groupResult.isError()) {
            return Result.error(groupResult.unwrapError());
        }

        const updatedGroups = this.#groups.map((g, i) =>
            i === groupIndex ? groupResult.unwrap() : g
        );

        return Result.ok(
            new Step(
                this.#id,
                this.#order,
                updatedGroups.every((g) => g.isApproved),
                updatedGroups
            )
        );
    }

    hasEligibleApprover(approverId: Id): boolean {
        return (
            !this.#isApproved &&
            this.#groups.some((g) => g.hasEligibleApprover(approverId))
        );
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            order: this.#order.toPlain(),
            isApproved: this.isApproved,
            groups: this.#groups.map((g) => g.toPlain()),
        };
    }
}
