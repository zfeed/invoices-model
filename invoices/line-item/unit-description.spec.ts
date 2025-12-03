import { testEquatable } from '../../building-blocks/equatable.test-helper';
import { UnitDescription } from './unit-description';

describe('UnitDescription', () => {
    testEquatable({
        typeName: 'UnitDescription',
        createEqual: () => [
            UnitDescription.create('Product A'),
            UnitDescription.create('Product A'),
            UnitDescription.create('Product A'),
        ],
        createDifferent: () => [
            UnitDescription.create('Product A'),
            UnitDescription.create('Product B'),
        ],
    });

    it('should create a unit description', () => {
        const description = UnitDescription.create('Test Product');
        expect(description).toBeDefined();
        expect(description.toString()).toBe('Test Product');
    });

    it('should convert to string', () => {
        const description = UnitDescription.create('My Product');
        expect(description.toString()).toBe('My Product');
    });
});

