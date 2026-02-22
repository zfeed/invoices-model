import { testEquatable } from '../../../../../building-blocks/equatable.test-helper';
import { UnitDescription } from './unit-description';

describe('UnitDescription', () => {
    testEquatable({
        typeName: 'UnitDescription',
        createEqual: () => [
            UnitDescription.create('Product A').unwrap(),
            UnitDescription.create('Product A').unwrap(),
            UnitDescription.create('Product A').unwrap(),
        ],
        createDifferent: () => [
            UnitDescription.create('Product A').unwrap(),
            UnitDescription.create('Product B').unwrap(),
        ],
    });

    it('should create a unit description', () => {
        const description = UnitDescription.create('Test Product').unwrap();
        expect(description.toPlain()).toBe('Test Product');
    });

    it('should not create an empty description', () => {
        const result = UnitDescription.create('');
        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '15000',
            })
        );
    });

    it('should not create a whitespace-only description', () => {
        const result = UnitDescription.create('   ');
        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '15000',
            })
        );
    });

    describe('toPlain / fromPlain', () => {
        it('round-trips through toPlain and fromPlain', () => {
            const description = UnitDescription.create('Product A').unwrap();
            const restored = UnitDescription.fromPlain(description.toPlain());

            expect(restored.equals(description)).toBe(true);
        });
    });
});
