import { AuthflowTemplate } from '../../../../core/financial-authorization/domain/authflow/authflow-template';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { RangeDataMapper, RangeRecord } from './range.data-mapper';
import {
    StepTemplateDataMapper,
    StepTemplateRecord,
} from './step-template.data-mapper';

export type AuthflowTemplateRecord = {
    id: IdRecord;
    range: RangeRecord;
    steps: StepTemplateRecord[];
};

export class AuthflowTemplateDataMapper extends AuthflowTemplate {
    static from(
        authflowTemplate: AuthflowTemplate
    ): AuthflowTemplateDataMapper {
        return Object.setPrototypeOf(
            authflowTemplate,
            AuthflowTemplateDataMapper.prototype
        ) as AuthflowTemplateDataMapper;
    }

    static fromRecord(
        record: AuthflowTemplateRecord
    ): AuthflowTemplateDataMapper {
        return new AuthflowTemplateDataMapper(
            IdDataMapper.fromRecord(record.id),
            RangeDataMapper.fromRecord(record.range),
            record.steps.map((s) => StepTemplateDataMapper.fromRecord(s))
        );
    }

    toRecord(): AuthflowTemplateRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            range: RangeDataMapper.from(this._range).toRecord(),
            steps: this._steps.map((s) =>
                StepTemplateDataMapper.from(s).toRecord()
            ),
        };
    }
}
