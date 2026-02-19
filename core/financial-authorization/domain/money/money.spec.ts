import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createMoney } from './money';

describe('Money', () => {
    describe('createMoney', () => {
        it('should create money with amount and currency', () => {
            const result = createMoney('10000', 'USD');

            expect(result.isOk()).toBe(true);
            const money = result.unwrap();
            expect(money.amount).toBe('10000');
            expect(money.currency).toBe('USD');
        });

        it('should create money with zero amount', () => {
            const result = createMoney('0', 'EUR');

            expect(result.isOk()).toBe(true);
            expect(result.unwrap().amount).toBe('0');
        });

        it('should fail when amount is not an integer', () => {
            const result = createMoney('100.50', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER
            );
        });

        it('should fail when amount is not a number', () => {
            const result = createMoney('abc', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER
            );
        });

        it('should fail when amount is negative', () => {
            const result = createMoney('-100', 'USD');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO
            );
        });

        it('should fail when currency is not a valid ISO 4217 code', () => {
            const result = createMoney('100', 'ABC');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });

        it('should fail when currency is empty', () => {
            const result = createMoney('100', '');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });

        it('should fail when currency has wrong length', () => {
            const result = createMoney('100', 'US');

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217
            );
        });
    });
});
