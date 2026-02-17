import { createId, createIdString } from './id';

describe('Id', () => {
    describe('createId', () => {
        it('should create a valid UUID', () => {
            const id = createId();
            expect(id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
            );
        });

        it('should create unique ids', () => {
            const id1 = createId();
            const id2 = createId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('createIdString', () => {
        it('should return the given string as Id', () => {
            const id = createIdString('test-id');
            expect(id).toBe('test-id');
        });
    });
});
