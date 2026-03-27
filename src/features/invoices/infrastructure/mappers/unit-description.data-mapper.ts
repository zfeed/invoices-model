import { UnitDescription } from '../../domain/line-item/unit-description/unit-description';

export type UnitDescriptionRecord = {
    value: string;
};

export class UnitDescriptionDataMapper extends UnitDescription {
    static from(unitDescription: UnitDescription): UnitDescriptionDataMapper {
        return Object.setPrototypeOf(
            unitDescription,
            UnitDescriptionDataMapper.prototype
        ) as UnitDescriptionDataMapper;
    }

    static fromRecord(
        record: UnitDescriptionRecord
    ): UnitDescriptionDataMapper {
        return new UnitDescriptionDataMapper(record.value);
    }

    toRecord(): UnitDescriptionRecord {
        return {
            value: this._value,
        };
    }
}
