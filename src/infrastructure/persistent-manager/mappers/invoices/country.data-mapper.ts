import { Country } from '../../../../core/invoices/domain/country/country';

export type CountryRecord = {
    code: string;
};

export class CountryDataMapper extends Country {
    static from(country: Country): CountryDataMapper {
        return Object.setPrototypeOf(
            country,
            CountryDataMapper.prototype
        ) as CountryDataMapper;
    }

    static fromRecord(record: CountryRecord): CountryDataMapper {
        return new CountryDataMapper(record.code);
    }

    toRecord(): CountryRecord {
        return {
            code: this._code,
        };
    }
}
