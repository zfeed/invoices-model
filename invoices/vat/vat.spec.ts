import { Vat } from './vat';
import { Numeric } from '../numeric/numeric';

describe('Vat', () => {
    describe('create', () => {
        it('should create vat from integer input', () => {
            const vat = Vat.create('20').unwrap();
            expect(vat.rate.equals(Numeric.create('0.2'))).toBe(true);
        });

        it('should create vat from decimal input', () => {
            const vat = Vat.create('0.5').unwrap();
            expect(vat.rate.equals(Numeric.create('0.005'))).toBe(true);
        });

        it('should not create vat when not numeric input', () => {
            const result = Vat.create('abc');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9000',
                })
            );
        });

        it('should not create vat when < 0 numeric input', () => {
            const result = Vat.create('-5');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9001',
                })
            );
        });

        it('should not create vat when > 100 numeric input', () => {
            const result = Vat.create('101');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9001',
                })
            );
        });

        it('should not create vat when more than two decimal places numeric input', () => {
            const result = Vat.create('10.123');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9000',
                })
            );
        });
    });

    describe('rate', () => {
        it('returns the correct rate', () => {
            const vat = Vat.create('10').unwrap();
            expect(vat.rate.equals(Numeric.create('0.1'))).toBe(true);
        });
    });

    describe('rate', () => {
        it('returns the correct rate', () => {
            const vat = Vat.create('10').unwrap();
            expect(vat.rate.equals(Numeric.create('0.1'))).toBe(true);
        });

        it('returns the correct rate', () => {
            const vat = Vat.create('0').unwrap();
            expect(vat.rate.equals(Numeric.create('0'))).toBe(true);
        });
    });

    describe('equals', () => {
        it('returns true for same rate', () => {
            const vat1 = Vat.create('15').unwrap();
            const vat2 = Vat.create('15').unwrap();
            expect(vat1.equals(vat2)).toBe(true);
        });
        it('returns false for different rates', () => {
            const vat1 = Vat.create('15').unwrap();
            const vat2 = Vat.create('20').unwrap();
            expect(vat1.equals(vat2)).toBe(false);
        });
    });
});
