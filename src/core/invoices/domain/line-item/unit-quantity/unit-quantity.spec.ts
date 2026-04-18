import { testEquatable } from '../../../../building-blocks/interfaces/equatable/equatable.test-helper.ts';
import { UnitQuantity } from './unit-quantity.ts';

describe('UnitQuantity', () => {
    testEquatable({
        typeName: 'UnitQuantity',
        createEqual: () => [
            UnitQuantity.create('5').unwrap(),
            UnitQuantity.create('5').unwrap(),
            UnitQuantity.create('5').unwrap(),
        ],
        createDifferent: () => [
            UnitQuantity.create('5').unwrap(),
            UnitQuantity.create('10').unwrap(),
        ],
    });

    it('should create a unit quantity', () => {
        const quantity = UnitQuantity.create('4').unwrap();
        expect(quantity.toPlain()).toBe('4');
    });

    it.each(['-1', '0', '-100', '-5'])(
        'should not create quantity that is not positive: %p',
        (invalidQuantity) => {
            const result = UnitQuantity.create(invalidQuantity);

            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '2001',
                })
            );
        }
    );

    it.each(['1.3', '2.5', '3.7', '400.1'])(
        'should not create a quantity that is not integer: %p',
        (invalidQuantity) => {
            const result = UnitQuantity.create(invalidQuantity);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '2000',
                })
            );
        }
    );

    it.each(['abc', ''])(
        'should not create quantity from non-numeric input: %p',
        (invalidQuantity) => {
            const result = UnitQuantity.create(invalidQuantity);
            expect(result.unwrapError()).toEqual(
                expect.objectContaining({
                    code: '2000',
                })
            );
        }
    );
});
