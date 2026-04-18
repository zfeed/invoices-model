import { Id } from './id.ts';

describe('Id', () => {
    describe('create', () => {
        it('should create a valid UUID', () => {
            const id = Id.create().unwrap().toPlain();
            expect(id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
            );
        });

        it('should create unique ids', () => {
            const id1 = Id.create().unwrap().toPlain();
            const id2 = Id.create().unwrap().toPlain();
            expect(id1).not.toBe(id2);
        });
    });
});
