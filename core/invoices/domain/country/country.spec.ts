import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
import { Country } from './country';

describe('Country', () => {
    testEquatable({
        typeName: 'Country',
        createEqual: () => [
            Country.create('US').unwrap(),
            Country.create('US').unwrap(),
            Country.create('US').unwrap(),
        ],
        createDifferent: () => [
            Country.create('US').unwrap(),
            Country.create('CA').unwrap(),
        ],
    });

    it('should create a country', () => {
        const result = Country.create('US');

        const country = result.unwrap();

        expect(country).toBeDefined();
    });

    it('should fail to create a country with not alpha 2 code', () => {
        const result = Country.create('USA');

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '7000',
            })
        );
    });
});
