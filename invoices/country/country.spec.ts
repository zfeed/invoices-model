import { testEquatable } from '../../building-blocks/equatable.test-helper';
import { Country } from './country';

describe('Country', () => {
    testEquatable({
        typeName: 'Country',
        createEqual: () => [
            Country.create({ code: 'US' }).unwrap(),
            Country.create({ code: 'US' }).unwrap(),
            Country.create({ code: 'US' }).unwrap(),
        ],
        createDifferent: () => [
            Country.create({ code: 'US' }).unwrap(),
            Country.create({ code: 'CA' }).unwrap(),
        ],
    });

    it('should create a country', () => {
        const result = Country.create({
            code: 'US',
        });

        const country = result.unwrap();

        expect(country).toBeDefined();
    });

    it('should fail to create a country with not alpha 2 code', () => {
        const result = Country.create({
            code: 'USA',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '7000',
            })
        );
    });
});
