import { testEquatable } from '../../../../shared/equatable.test-helper.ts';
import { Country } from './country.ts';

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
        const country = Country.create('US').unwrap();
        expect(country.equals(Country.create('US').unwrap())).toBe(true);
    });

    it('should fail to create a country with not alpha 2 code', () => {
        const result = Country.create('USA');
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '7000',
            })
        );
    });

    it('should serialize to plain string', () => {
        const country = Country.create('US').unwrap();
        expect(country.toPlain()).toBe('US');
    });

    it('should reconstruct from plain', () => {
        const country = Country.create('US').unwrap();
        expect(country.toPlain()).toBe('US');
    });
});
