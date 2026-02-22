import { testComparable } from '../../../../building-blocks/comparable.test-helper';
import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
import { Numeric } from './numeric';

describe('Numeric', () => {
    testEquatable({
        typeName: 'Numeric',
        createEqual: () => [
            Numeric.create('123.45').unwrap(),
            Numeric.create('123.45').unwrap(),
            Numeric.create('123.45').unwrap(),
        ],
        createDifferent: () => [
            Numeric.create('123.45').unwrap(),
            Numeric.create('678.90').unwrap(),
        ],
    });

    testComparable({
        typeName: 'Numeric',
        createAscending: () => [
            Numeric.create('10.5').unwrap(),
            Numeric.create('50.25').unwrap(),
            Numeric.create('100.75').unwrap(),
        ],
        createEqual: () => [Numeric.create('42.42').unwrap(), Numeric.create('42.42').unwrap()],
    });

    test.each([
        ['2', '3', '6'],
        ['0.5', '0.2', '0.1'],
        ['100.35', '2', '200.7'],
    ])('multiplies %s and %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.multiplyBy(numB);
        expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
    });

    test.each([
        ['1.5', '2.5', '4'],
        ['0.1', '0.2', '0.3'],
        ['100.35', '2', '102.35'],
    ])('adds %s and %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.add(numB);
        expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
    });

    it('should handle multiplication with zero', () => {
        const a = Numeric.create('0').unwrap();
        const b = Numeric.create('100').unwrap();
        const result = a.multiplyBy(b);
        expect(result.equals(Numeric.create('0').unwrap())).toBe(true);
    });

    it('should handle addition with zero', () => {
        const a = Numeric.create('0').unwrap();
        const b = Numeric.create('100').unwrap();
        const result = a.add(b);
        expect(result.equals(Numeric.create('100').unwrap())).toBe(true);
    });

    it('should handle large numbers', () => {
        const a = Numeric.create('1000000000000000000').unwrap();
        const b = Numeric.create('2').unwrap();
        const result = a.multiplyBy(b);
        expect(result.equals(Numeric.create('2000000000000000000').unwrap())).toBe(true);
    });

    test.each([
        ['0.1', '0.2', '0.3'],
        ['0.12', '0.56', '0.68'],
        ['0.99', '0.01', '1.00'],
    ])('adds %s and %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.add(numB);
        expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
    });

    test.each([
        ['0.1', '0.2', '0.5'],
        ['0.13', '0.57', '0.22807017543859649123'],
        ['0.99', '0.01', '99'],
    ])('divides %s by %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.divideBy(numB).unwrap();
        expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
    });

    describe('decimalPlaces', () => {
        test('returns correct decimal places', () => {
            expect(Numeric.create('10.5').unwrap().decimalPlaces()).toBe(1);
            expect(Numeric.create('10.50').unwrap().decimalPlaces()).toBe(1);
            expect(Numeric.create('10').unwrap().decimalPlaces()).toBe(0);
            expect(Numeric.create('0.1234').unwrap().decimalPlaces()).toBe(4);
        });
    });
});
