import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import { Order } from './order.ts';

describe('Order', () => {
    describe('create', () => {
        it('should create an order from a number', () => {
            const result = Order.create(3);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe(3);
        });

        it('should create an order from zero', () => {
            const result = Order.create(0);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe(0);
        });

        it('should return an error for a negative number', () => {
            const result = Order.create(-1);
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE
            );
        });
    });
});
