import { testEquatable } from '../../../building-blocks/equatable.test-helper';
import { Numeric } from '../numeric/numeric';
import { VatRate } from './vat-rate';

describe('VatRate', () => {
    testEquatable({
        typeName: 'VatRate',
        createEqual: () => [
            VatRate.create('20').unwrap(),
            VatRate.create('20').unwrap(),
            VatRate.create('20').unwrap(),
        ],
        createDifferent: () => [
            VatRate.create('20').unwrap(),
            VatRate.create('15').unwrap(),
        ],
    });

    describe('create', () => {
        it('should create vat from integer input', () => {
            const vat = VatRate.create('20').unwrap();
            expect(vat.rate.equals(Numeric.create('0.2'))).toBe(true);
        });

        it('should create vat from decimal input', () => {
            const vat = VatRate.create('0.5').unwrap();
            expect(vat.rate.equals(Numeric.create('0.005'))).toBe(true);
        });

        it('should not create vat when not numeric input', () => {
            const result = VatRate.create('abc');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9000',
                })
            );
        });

        it('should not create vat when < 0 numeric input', () => {
            const result = VatRate.create('-5');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9001',
                })
            );
        });

        it('should not create vat when > 100 numeric input', () => {
            const result = VatRate.create('101');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '9001',
                })
            );
        });

        it('should not create vat when more than two decimal places numeric input', () => {
            const result = VatRate.create('10.123');
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
            const vat = VatRate.create('10').unwrap();
            expect(vat.rate.equals(Numeric.create('0.1'))).toBe(true);
        });
    });

    describe('rate', () => {
        it('returns the correct rate', () => {
            const vat = VatRate.create('5').unwrap();
            expect(vat.rate.equals(Numeric.create('0.05'))).toBe(true);
        });

        it('returns the correct rate', () => {
            const vat = VatRate.create('0').unwrap();
            expect(vat.rate.equals(Numeric.create('0'))).toBe(true);
        });
    });
});
