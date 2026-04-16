import { testComparable } from '../../../../shared/comparable.test-helper.ts';
import { testEquatable } from '../../../../shared/equatable.test-helper.ts';
import { Numeric } from './numeric.ts';

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
        createEqual: () => [
            Numeric.create('42.42').unwrap(),
            Numeric.create('42.42').unwrap(),
        ],
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
        ['0.12', '0.56', '0.68'],
        ['0.99', '0.01', '1'],
    ])('adds %s and %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.add(numB);
        expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
    });

    test.each([
        ['5', '3', '2'],
        ['0.3', '0.1', '0.2'],
        ['100.35', '0.35', '100'],
    ])('subtracts %s and %s', (a, b, expected) => {
        const numA = Numeric.create(a).unwrap();
        const numB = Numeric.create(b).unwrap();
        const result = numA.subtract(numB);
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
        expect(
            result.equals(Numeric.create('2000000000000000000').unwrap())
        ).toBe(true);
    });

    it('should return error for division by zero', () => {
        const a = Numeric.create('10').unwrap();
        const b = Numeric.create('0').unwrap();
        const result = a.divideBy(b);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '12001' })
        );
    });

    test.each([['abc'], [''], ['12.34.56']])(
        'should return error for invalid value: %s',
        (value) => {
            const result = Numeric.create(value);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({ code: '12000' })
            );
        }
    );

    describe('toDecimalPlaces', () => {
        test.each([
            ['1.2345', 2, '1.24'],
            ['1.2', 0, '2'],
            ['1.005', 2, '1.01'],
        ])('rounds %s to %s decimal places (up)', (value, places, expected) => {
            const result = Numeric.create(value)
                .unwrap()
                .toDecimalPlaces(places);
            expect(result.equals(Numeric.create(expected).unwrap())).toBe(true);
        });
    });

    describe('decimalPlaces', () => {
        test('returns correct decimal places', () => {
            expect(Numeric.create('10.5').unwrap().decimalPlaces()).toBe(1);
            expect(Numeric.create('10.50').unwrap().decimalPlaces()).toBe(1);
            expect(Numeric.create('10').unwrap().decimalPlaces()).toBe(0);
            expect(Numeric.create('0.1234').unwrap().decimalPlaces()).toBe(4);
        });
    });

    describe('toString', () => {
        test.each([
            ['123.45', '123.45'],
            ['100', '100'],
            ['0.10', '0.1'],
        ])('converts %s to string %s', (input, expected) => {
            expect(Numeric.create(input).unwrap().toString()).toBe(expected);
        });
    });
});
