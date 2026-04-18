import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import { Money } from './money.ts';

describe('Money', () => {
    describe('create', () => {
        it('should create money with amount and currency', () => {
            const result = Money.create('10000', 'USD');

            expect(result.isOk()).toBe(true);
            const money = result.unwrap();
            expect(money.toPlain()).toEqual({
                amount: '10000',
                currency: 'USD',
            });
        });

        it('should create money with zero amount', () => {
            const result = Money.create('0', 'EUR');

            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain().amount).toBe('0');
        });

        it('should fail when amount is not an integer', () => {
            const result = Money.create('100.50', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER
            );
        });

        it('should fail when amount is not a number', () => {
            const result = Money.create('abc', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER
            );
        });

        it('should fail when amount is negative', () => {
            const result = Money.create('-100', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO
            );
        });

        it('should fail when currency is not a valid ISO 4217 code', () => {
            const result = Money.create('100', 'ABC');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });

        it('should fail when currency is empty', () => {
            const result = Money.create('100', '');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });

        it('should fail when currency has wrong length', () => {
            const result = Money.create('100', 'US');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });
    });
});
