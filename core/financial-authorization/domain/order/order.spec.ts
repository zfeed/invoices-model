import { createOrder } from './order';

describe('Order', () => {
    describe('createOrder', () => {
        it('should create an order from a number', () => {
            const order = createOrder(3);
            expect(order).toBe(3);
        });

        it('should create an order from zero', () => {
            const order = createOrder(0);
            expect(order).toBe(0);
        });
    });
});
