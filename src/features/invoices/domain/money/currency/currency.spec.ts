import { testEquatable } from '../../../../../shared/equatable.test-helper';
import { Currency } from './currency';

describe('Currency', () => {
    testEquatable({
        typeName: 'Currency',
        createEqual: () => [
            Currency.create('USD').unwrap(),
            Currency.create('USD').unwrap(),
            Currency.create('USD').unwrap(),
        ],
        createDifferent: () => [
            Currency.create('USD').unwrap(),
            Currency.create('EUR').unwrap(),
        ],
    });

    test.each(['USD', 'EUR', 'JPY'])('should create currency %s', (code) => {
        const currency = Currency.create(code).unwrap();

        expect(currency.toString()).toBe(code);
    });

    test.each(['ABC', 'XYZ'])(
        'should return error for invalid currency code %s',
        (code) => {
            const result = Currency.create(code);

            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '5000',
                })
            );
        }
    );

    test('should reconstruct from plain', () => {
        const currency = Currency.create('USD').unwrap();

        expect(currency.equals(Currency.create('USD').unwrap())).toBe(true);
    });

    test('should return string representation', () => {
        const currency = Currency.create('EUR').unwrap();

        expect(currency.toString()).toBe('EUR');
    });
});
