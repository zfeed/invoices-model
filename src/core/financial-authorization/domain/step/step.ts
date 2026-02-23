import { DOMAIN_ERROR_CODE, DomainError, Mappable, Result } from '../../../../building-blocks';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Group } from '../groups/group';
import { Id } from '../id/id';
import { Order } from '../order/order';

export class Step implements Mappable<ReturnType<Step['toPlain']>> {
    #id: Id;
    #order: Order;
    #groups: Group[];

    protected constructor(id: Id, order: Order, groups: Group[]) {
        this.#id = id;
        this.#order = order;
        this.#groups = groups;
    }

    public get id(): Id {
        return this.#id;
    }

    public get order(): Order {
        return this.#order;
    }

    public get isApproved(): boolean {
        return this.#groups.every((g) => g.isApproved);
    }

    public get groups(): readonly Group[] {
        return this.#groups;
    }

    static create(data: { order: Order; groups: Group[] }) {
        return Result.ok(new Step(Id.create().unwrap(), data.order, data.groups));
    }

    static fromPlain(plain: {
        id: string;
        order: number;
        groups: {
            id: string;
            isApproved: boolean;
            approvers: { id: string; name: string; email: string }[];
            approvals: { approverId: string; createdAt: string; comment: string | null }[];
        }[];
    }) {
        return new Step(
            Id.fromPlain(plain.id),
            Order.fromPlain(plain.order),
            plain.groups.map((g) => Group.fromPlain(g)),
        );
    }

    approve(approver: Approver): Result<DomainError, Step> {
        if (this.isApproved) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                    message: 'No pending steps found',
                })
            );
        }

        const groupIndex = this.#groups.findIndex(
            (g) => !g.isApproved && g.approvers.some((a) => a.id.equals(approver.id))
        );

        if (groupIndex === -1) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                    message: `No eligible group found for approver ${approver.id.toPlain()}`,
                })
            );
        }

        const approvalResult = Approval.create({ approverId: approver.id, comment: null });

        if (approvalResult.isError()) {
            return Result.error(approvalResult.unwrapError());
        }

        const groupResult = this.#groups[groupIndex].apply(approvalResult.unwrap());

        if (groupResult.isError()) {
            return Result.error(groupResult.unwrapError());
        }

        const updatedGroups = this.#groups.map((g, i) =>
            i === groupIndex ? groupResult.unwrap() : g
        );

        return Result.ok(new Step(this.#id, this.#order, updatedGroups));
    }

    hasEligibleApprover(approverId: Id): boolean {
        return this.#groups.some((g) => g.hasEligibleApprover(approverId));
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
