import { Comparable } from './comparable.interface';
import { Equatable } from './equatable.interface';

export interface ComparableTestConfig<T extends Comparable<T> & Equatable<T>> {
    typeName: string;

    createAscending: () => [T, T, T];

    createEqual: () => [T, T];
}

export function testComparable<T extends Comparable<T> & Equatable<T>>(
    config: ComparableTestConfig<T>
): void {
    describe(`${config.typeName} - Comparable implementation`, () => {
        describe('lessThan', () => {
            it('should return false when comparing with itself (non-reflexivity)', () => {
                const [x] = config.createAscending();
                expect(x.lessThan(x)).toBe(false);
            });

            it('should return false when comparing equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.lessThan(y)).toBe(false);
                expect(y.lessThan(x)).toBe(false);
            });

            it('should return true when first is less than second', () => {
                const [x, y] = config.createAscending();
                expect(x.lessThan(y)).toBe(true);
            });

            it('should return false when first is greater than second (antisymmetry)', () => {
                const [x, y] = config.createAscending();
                expect(y.lessThan(x)).toBe(false);
            });

            it('should be transitive (if x < y and y < z then x < z)', () => {
                const [x, y, z] = config.createAscending();
                expect(x.lessThan(y)).toBe(true);
                expect(y.lessThan(z)).toBe(true);
                expect(x.lessThan(z)).toBe(true);
            });

            it('should return consistent results', () => {
                const [x, y] = config.createAscending();
                const firstCall = x.lessThan(y);
                const secondCall = x.lessThan(y);
                const thirdCall = x.lessThan(y);
                expect(firstCall).toBe(true);
                expect(secondCall).toBe(true);
                expect(thirdCall).toBe(true);
            });
        });

        describe('lessThanEqual', () => {
            it('should return true when comparing with itself', () => {
                const [x] = config.createAscending();
                expect(x.lessThanEqual(x)).toBe(true);
            });

            it('should return true when comparing equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.lessThanEqual(y)).toBe(true);
                expect(y.lessThanEqual(x)).toBe(true);
            });

            it('should return true when first is less than second', () => {
                const [x, y] = config.createAscending();
                expect(x.lessThanEqual(y)).toBe(true);
            });

            it('should return false when first is greater than second', () => {
                const [x, y] = config.createAscending();
                expect(y.lessThanEqual(x)).toBe(false);
            });

            it('should be consistent with lessThan for unequal values', () => {
                const [x, y] = config.createAscending();
                expect(x.lessThanEqual(y)).toBe(x.lessThan(y) || x.equals(y));
            });

            it('should be consistent with lessThan for equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.lessThanEqual(y)).toBe(x.lessThan(y) || x.equals(y));
            });
        });

        describe('greaterThan', () => {
            it('should return false when comparing with itself (non-reflexivity)', () => {
                const [x] = config.createAscending();
                expect(x.greaterThan(x)).toBe(false);
            });

            it('should return false when comparing equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.greaterThan(y)).toBe(false);
                expect(y.greaterThan(x)).toBe(false);
            });

            it('should return true when first is greater than second', () => {
                const [x, y] = config.createAscending();
                expect(y.greaterThan(x)).toBe(true);
            });

            it('should return false when first is less than second (antisymmetry)', () => {
                const [x, y] = config.createAscending();
                expect(x.greaterThan(y)).toBe(false);
            });

            it('should be transitive (if x > y and y > z then x > z)', () => {
                const [x, y, z] = config.createAscending();
                expect(z.greaterThan(y)).toBe(true);
                expect(y.greaterThan(x)).toBe(true);
                expect(z.greaterThan(x)).toBe(true);
            });

            it('should be inverse of lessThan', () => {
                const [x, y] = config.createAscending();
                expect(x.greaterThan(y)).toBe(y.lessThan(x));
                expect(y.greaterThan(x)).toBe(x.lessThan(y));
            });
        });

        describe('greaterThanEqual', () => {
            it('should return true when comparing with itself', () => {
                const [x] = config.createAscending();
                expect(x.greaterThanEqual(x)).toBe(true);
            });

            it('should return true when comparing equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.greaterThanEqual(y)).toBe(true);
                expect(y.greaterThanEqual(x)).toBe(true);
            });

            it('should return true when first is greater than second', () => {
                const [x, y] = config.createAscending();
                expect(y.greaterThanEqual(x)).toBe(true);
            });

            it('should return false when first is less than second', () => {
                const [x, y] = config.createAscending();
                expect(x.greaterThanEqual(y)).toBe(false);
            });

            it('should be consistent with greaterThan for unequal values', () => {
                const [x, y] = config.createAscending();
                expect(y.greaterThanEqual(x)).toBe(
                    y.greaterThan(x) || y.equals(x)
                );
            });

            it('should be consistent with greaterThan for equal values', () => {
                const [x, y] = config.createEqual();
                expect(x.greaterThanEqual(y)).toBe(
                    x.greaterThan(y) || x.equals(y)
                );
            });
        });
    });
}
