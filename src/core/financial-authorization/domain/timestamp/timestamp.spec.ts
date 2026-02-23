import { Timestamp } from './timestamp';

describe('Timestamp', () => {
    describe('create', () => {
        it('should create a timestamp with a valid ISO string', () => {
            const timestamp = Timestamp.create();
            const isoString = timestamp.toPlain();
            expect(new Date(isoString).toISOString()).toBe(isoString);
        });

        it('should create a timestamp close to now', () => {
            const before = new Date();
            const timestamp = Timestamp.create();
            const after = new Date();
            const timestampDate = new Date(timestamp.toPlain());
            expect(timestampDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(timestampDate.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });
});
