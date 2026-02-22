import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createOrder } from './order';

describe('Order', () => {
    describe('createOrder', () => {
        it('should create an order from a number', () => {
            const result = createOrder(3);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(3);
        });

        it('should create an order from zero', () => {
            const result = createOrder(0);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(0);
        });

        it('should return an error for a negative number', () => {
            const result = createOrder(-1);
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE
            );
        });
    });
});
