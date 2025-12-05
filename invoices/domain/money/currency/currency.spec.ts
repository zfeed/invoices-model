import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
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

    test('should create currency', () => {
        const result = Currency.create('USD').unwrap();

        expect(result).toBeDefined();
    });

    test.each([{ currency: 'ABC' }, { currency: 'XYZ' }])(
        'should return error for invalid currency code',
        ({ currency }) => {
            const result = Currency.create(currency);

            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '5000',
                })
            );
        }
    );
});
