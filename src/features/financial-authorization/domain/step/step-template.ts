import { DomainError, Mappable, Result } from '../../../../shared/index.ts';
import { GroupTemplate } from '../groups/group-template.ts';
import { Id } from '../id/id.ts';
import { Order } from '../order/order.ts';
import { Step } from './step.ts';

export class StepTemplate implements Mappable<
    ReturnType<StepTemplate['toPlain']>
> {
    protected _id: Id;
    protected _order: Order;
    protected _groups: GroupTemplate[];

    protected constructor(id: Id, order: Order, groups: GroupTemplate[]) {
        this._id = id;
        this._order = order;
        this._groups = groups;
    }

    public get id(): Id {
        return this._id;
    }

    public get order(): Order {
        return this._order;
    }

    public get groups(): GroupTemplate[] {
        return this._groups;
    }

    static create(data: { order: Order; groups: GroupTemplate[] }) {
        return Result.ok(
            new StepTemplate(Id.create().unwrap(), data.order, data.groups)
        );
    }

    toStep(): Result<DomainError, Step> {
        const groupResults = this._groups.reduce<
            Result<DomainError, import('../groups/group.ts').Group[]>
        >(
            (acc, template) =>
                acc.flatMap((groups) =>
                    template.toGroup().map((group) => [...groups, group])
                ),
            Result.ok([])
        );

        return groupResults.flatMap((groups) =>
            Step.create({ order: this._order, groups })
        );
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            order: this._order.toPlain(),
            groups: this._groups.map((g) => g.toPlain()),
        };
    }
}
