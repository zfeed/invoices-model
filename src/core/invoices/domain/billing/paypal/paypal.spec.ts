import { testEquatable } from '../../../../../building-blocks/equatable.test-helper';
import { Paypal } from './paypal';

describe('Paypal', () => {
    testEquatable({
        typeName: 'Paypal',
        createEqual: () => [
            Paypal.create({ email: 'billing@company.com' }).unwrap(),
            Paypal.create({ email: 'billing@company.com' }).unwrap(),
            Paypal.create({ email: 'billing@company.com' }).unwrap(),
        ],
        createDifferent: () => [
            Paypal.create({ email: 'billing1@company.com' }).unwrap(),
            Paypal.create({ email: 'billing2@company.com' }).unwrap(),
        ],
    });

    it('should create a paypal billing', () => {
        const result = Paypal.create({ email: 'billing@company.com' });
        const paypal = result.unwrap();

        expect(paypal.type).toBe('PAYPAL');
        expect(paypal.data.email.equals('billing@company.com')).toBe(true);
    });

    it('should fail with invalid email', () => {
        const result = Paypal.create({ email: 'not-an-email' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '6000' })
        );
    });

    it('should serialize to plain and back', () => {
        const paypal = Paypal.create({ email: 'billing@company.com' }).unwrap();
        const plain = paypal.toPlain();
        const restored = Paypal.fromPlain(plain);

        expect(restored.equals(paypal)).toBe(true);
    });
});
