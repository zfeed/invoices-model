import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { GroupTemplate } from '../groups/group-template';
import { Id } from '../id/id';
import { Order } from '../order/order';
import { Step } from './step';

export class StepTemplate implements Mappable<ReturnType<StepTemplate['toPlain']>> {
    #id: Id;
    #order: Order;
    #groups: GroupTemplate[];

    protected constructor(id: Id, order: Order, groups: GroupTemplate[]) {
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

    public get groups(): readonly GroupTemplate[] {
        return this.#groups;
    }

    static create(data: { order: Order; groups: GroupTemplate[] }) {
        return Result.ok(new StepTemplate(Id.create().unwrap(), data.order, data.groups));
    }

    static fromPlain(plain: {
        id: string;
        order: number;
        groups: {
            id: string;
            requiredApprovals: number;
            approvers: { id: string; name: string; email: string }[];
        }[];
    }) {
        return new StepTemplate(
            Id.fromPlain(plain.id),
            Order.fromPlain(plain.order),
            plain.groups.map((g) => GroupTemplate.fromPlain(g)),
        );
    }

    toStep(): Result<DomainError, Step> {
        const groupResults = this.#groups.reduce<Result<DomainError, import('../groups/group').Group[]>>(
            (acc, template) =>
                acc.flatMap((groups) =>
                    template.toGroup().map((group) => [...groups, group])
                ),
            Result.ok([])
        );

        return groupResults.flatMap((groups) =>
            Step.create({ order: this.#order, groups })
        );
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            order: this.#order.toPlain(),
            groups: this.#groups.map((g) => g.toPlain()),
        };
    }
}
