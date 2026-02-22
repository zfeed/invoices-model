import { createTimestamp } from './timestamp';

describe('Timestamp', () => {
    describe('createTimestamp', () => {
        it('should create a timestamp as a Date', () => {
            const timestamp = createTimestamp();
            expect(timestamp).toBeInstanceOf(Date);
        });

        it('should create a timestamp close to now', () => {
            const before = new Date();
            const timestamp = createTimestamp();
            const after = new Date();
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });
});
