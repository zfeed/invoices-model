import { createReferenceId } from './reference-id';

describe('ReferenceId', () => {
    describe('createReferenceId', () => {
        it('should create a reference id from a string', () => {
            const referenceId = createReferenceId('INV-001');
            expect(referenceId).toBe('INV-001');
        });
    });
});
