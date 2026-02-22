import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createMoney } from '../money/money';
import { createRange } from './range';

describe('Range', () => {
    describe('createRange', () => {
        it('should create a range with valid from and to', () => {
            const from = createMoney('100', 'USD').unwrap();
            const to = createMoney('500', 'USD').unwrap();

            const result = createRange(from, to);

            expect(result.isOk()).toBe(true);
            const range = result.unwrap();
            expect(range.from).toEqual(from);
            expect(range.to).toEqual(to);
        });

        it('should create a range when from equals to', () => {
            const from = createMoney('100', 'USD').unwrap();
            const to = createMoney('100', 'USD').unwrap();

            const result = createRange(from, to);

            expect(result.isOk()).toBe(true);
        });

        it('should create a range with zero from', () => {
            const from = createMoney('0', 'EUR').unwrap();
            const to = createMoney('1000', 'EUR').unwrap();

            const result = createRange(from, to);

            expect(result.isOk()).toBe(true);
        });

        it('should fail when currencies are not equal', () => {
            const from = createMoney('100', 'USD').unwrap();
            const to = createMoney('500', 'EUR').unwrap();

            const result = createRange(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL
            );
        });

        it('should fail when from is greater than to', () => {
            const from = createMoney('500', 'USD').unwrap();
            const to = createMoney('100', 'USD').unwrap();

            const result = createRange(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO
            );
        });

        it('should check currencies before checking order', () => {
            const from = createMoney('500', 'USD').unwrap();
            const to = createMoney('100', 'EUR').unwrap();

            const result = createRange(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL
            );
        });
    });
});
