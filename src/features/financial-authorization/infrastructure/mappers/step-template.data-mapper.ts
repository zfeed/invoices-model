import { StepTemplate } from '../../domain/step/step-template';
import {
    GroupTemplateDataMapper,
    GroupTemplateRecord,
} from './group-template.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { OrderDataMapper, OrderRecord } from './order.data-mapper';

export type StepTemplateRecord = {
    id: IdRecord;
    order: OrderRecord;
    groups: GroupTemplateRecord[];
};

export class StepTemplateDataMapper extends StepTemplate {
    static from(stepTemplate: StepTemplate): StepTemplateDataMapper {
        return Object.setPrototypeOf(
            stepTemplate,
            StepTemplateDataMapper.prototype
        ) as StepTemplateDataMapper;
    }

    static fromRecord(record: StepTemplateRecord): StepTemplateDataMapper {
        return new StepTemplateDataMapper(
            IdDataMapper.fromRecord(record.id),
            OrderDataMapper.fromRecord(record.order),
            record.groups.map((g) => GroupTemplateDataMapper.fromRecord(g))
        );
    }

    toRecord(): StepTemplateRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            order: OrderDataMapper.from(this._order).toRecord(),
            groups: this._groups.map((g) =>
                GroupTemplateDataMapper.from(g).toRecord()
            ),
        };
    }
}
