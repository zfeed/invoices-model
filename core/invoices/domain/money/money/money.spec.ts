import { testEquatable } from '../../../../../building-blocks/equatable.test-helper';
import { Numeric } from '../../numeric/numeric';
import { Currency } from '../currency/currency';
import { Money } from './money';

describe('Money', () => {
    testEquatable({
        typeName: 'Money',
        createEqual: () => [
            Money.create('100', 'USD').unwrap(),
            Money.create('100', 'USD').unwrap(),
            Money.create('100', 'USD').unwrap(),
        ],
        createDifferent: () => [
            Money.create('100', 'USD').unwrap(),
            Money.create('200', 'USD').unwrap(),
        ],
    });

    test.each([
        { amount: '100', currency: 'USD' },
        { amount: '30045', currency: 'JPY' },
        { amount: '123', currency: 'BHD' },
    ])('should create Money for %s', ({ amount, currency }) => {
        const money = Money.create(amount, currency).unwrap();
        const expectedAmount = Numeric.create(amount).unwrap();
        const expectedCurrency = Currency.create(currency).unwrap();
        expect(money.amount.equals(expectedAmount)).toBe(true);
        expect(money.currency.equals(expectedCurrency)).toBe(true);
    });

    test('should not create money from negative int', () => {
        const result = Money.create('-200', 'USD');

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4001',
            })
        );
    });

    test('should not create money from decimal', () => {
        const result = Money.create('200.50', 'USD');

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4000',
            })
        );
    });

    test('should not create money with invalid currency', () => {
        const result = Money.create('100', 'INVALID');

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '5000',
            })
        );
    });

    test('should add two Money values with same currency', () => {
        const money1 = Money.create('100', 'USD').unwrap();
        const money2 = Money.create('250', 'USD').unwrap();

        const result = money1.add(money2).unwrap();

        expect(result.equals(Money.create('350', 'USD').unwrap())).toBe(true);
    });

    test('should not add two Money values with different currencies', () => {
        const money1 = Money.create('100', 'USD').unwrap();
        const money2 = Money.create('50', 'EUR').unwrap();

        const result = money1.add(money2);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4002',
            })
        );
    });

    test('should subtract two Money values with same currency', () => {
        const money1 = Money.create('300', 'USD').unwrap();
        const money2 = Money.create('100', 'USD').unwrap();

        const result = money1.subtract(money2).unwrap();

        expect(result.equals(Money.create('200', 'USD').unwrap())).toBe(true);
    });

    test('should not subtract two Money values with different currencies', () => {
        const money1 = Money.create('300', 'USD').unwrap();
        const money2 = Money.create('100', 'EUR').unwrap();

        const result = money1.subtract(money2);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '4002',
            })
        );
    });

    test('should multiply by factor and round up to integer', () => {
        const money = Money.create('100', 'USD').unwrap();
        const factor = Numeric.create('0.333').unwrap();

        const result = money.multiplyBy(factor);

        expect(result.equals(Money.create('34', 'USD').unwrap())).toBe(true);
    });

    test('should return string representation', () => {
        const money = Money.create('1500', 'USD').unwrap();

        expect(money.toString()).toBe('1500 USD');
    });

    test('should return plain object', () => {
        const money = Money.create('1500', 'EUR').unwrap();

        expect(money.toPlain()).toEqual({
            amount: '1500',
            currency: 'EUR',
        });
    });

    test('should reconstruct from plain object', () => {
        const plain = { amount: '1500', currency: 'USD' };
        const money = Money.fromPlain(plain);

        expect(money.equals(Money.create('1500', 'USD').unwrap())).toBe(true);
    });
});
