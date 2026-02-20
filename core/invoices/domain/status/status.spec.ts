import { Status } from './status';

describe('Status', () => {
    describe('issued', () => {
        it('should create a status with ISSUED value', () => {
            const status = Status.issued();

            expect(status.toString()).toBe('ISSUED');
        });
    });

    describe('equals', () => {
        it('should be equal to another ISSUED status', () => {
            const a = Status.issued();
            const b = Status.issued();

            expect(a.equals(b)).toBe(true);
        });
    });
});
