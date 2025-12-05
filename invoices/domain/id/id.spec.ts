import { testEquatable } from '../../../building-blocks/equatable.test-helper';
import { Id } from './id';

describe(Id, () => {
    it('should create an id', () => {
        const result = Id.create();
        const id = result.unwrap();
        expect(id).toBeDefined();
    });

    testEquatable({
        typeName: Id.name,
        createEqual: () => {
            const id = Id.create().unwrap();
            return [id, id, id];
        },
        createDifferent: () => [Id.create().unwrap(), Id.create().unwrap()],
    });
});
