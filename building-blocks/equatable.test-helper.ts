import { Equatable } from './equatable.interface';

export interface EquatableTestConfig<T extends Equatable<T>> {
    typeName: string;

    createEqual: () => [T, T, T];

    createDifferent: () => [T, T];
}

export function testEquatable<T extends Equatable<T>>(
    config: EquatableTestConfig<T>
): void {
    describe(`${config.typeName} - Equatable implementation`, () => {
        describe('Reflexivity', () => {
            it('should equal itself (x.equals(x) = true)', () => {
                const [x] = config.createEqual();
                expect(x.equals(x)).toBe(true);
            });
        });

        describe('Symmetry', () => {
            it('should be symmetric for equal objects (if x.equals(y) then y.equals(x))', () => {
                const [x, y] = config.createEqual();

                expect(x.equals(y)).toBe(true);
                expect(y.equals(x)).toBe(true);
            });

            it('should be symmetric for different objects (if !x.equals(y) then !y.equals(x))', () => {
                const [x, y] = config.createDifferent();

                expect(x.equals(y)).toBe(false);
                expect(y.equals(x)).toBe(false);
            });
        });

        describe('Transitivity', () => {
            it('should be transitive (if x.equals(y) and y.equals(z) then x.equals(z))', () => {
                const [x, y, z] = config.createEqual();

                expect(x.equals(y)).toBe(true);
                expect(y.equals(z)).toBe(true);
                expect(x.equals(z)).toBe(true);
            });
        });

        describe('Consistency', () => {
            it('should return consistent results for equal objects', () => {
                const [x, y] = config.createEqual();

                const firstCall = x.equals(y);
                const secondCall = x.equals(y);
                const thirdCall = x.equals(y);

                expect(firstCall).toBe(true);
                expect(secondCall).toBe(true);
                expect(thirdCall).toBe(true);
            });

            it('should return consistent results for different objects', () => {
                const [x, y] = config.createDifferent();

                const firstCall = x.equals(y);
                const secondCall = x.equals(y);
                const thirdCall = x.equals(y);

                expect(firstCall).toBe(false);
                expect(secondCall).toBe(false);
                expect(thirdCall).toBe(false);
            });
        });

        describe('Inequality', () => {
            it('should correctly identify different objects as not equal', () => {
                const [x, y] = config.createDifferent();

                expect(x.equals(y)).toBe(false);
            });
        });
    });
}
