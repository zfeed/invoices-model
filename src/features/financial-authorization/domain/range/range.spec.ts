import { KNOWN_ERROR_CODE } from '../../../../shared/errors/known-error-codes.ts';
import { Money } from '../money/money.ts';
import { Range } from './range.ts';

describe('Range', () => {
    describe('create', () => {
        it('should create a range with valid from and to', () => {
            const from = Money.create('100', 'USD').unwrap();
            const to = Money.create('500', 'USD').unwrap();

            const result = Range.create(from, to);

            expect(result.isOk()).toBe(true);
            const range = result.unwrap();
            expect(range.toPlain()).toEqual({
                from: { amount: '100', currency: 'USD' },
                to: { amount: '500', currency: 'USD' },
            });
        });

        it('should create a range when from equals to', () => {
            const from = Money.create('100', 'USD').unwrap();
            const to = Money.create('100', 'USD').unwrap();

            const result = Range.create(from, to);

            expect(result.isOk()).toBe(true);
        });

        it('should create a range with zero from', () => {
            const from = Money.create('0', 'EUR').unwrap();
            const to = Money.create('1000', 'EUR').unwrap();

            const result = Range.create(from, to);

            expect(result.isOk()).toBe(true);
        });

        it('should fail when currencies are not equal', () => {
            const from = Money.create('100', 'USD').unwrap();
            const to = Money.create('500', 'EUR').unwrap();

            const result = Range.create(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL
            );
        });

        it('should fail when from is greater than to', () => {
            const from = Money.create('500', 'USD').unwrap();
            const to = Money.create('100', 'USD').unwrap();

            const result = Range.create(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO
            );
        });

        it('should check currencies before checking order', () => {
            const from = Money.create('500', 'USD').unwrap();
            const to = Money.create('100', 'EUR').unwrap();

            const result = Range.create(from, to);

            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL
            );
        });
    });
});
