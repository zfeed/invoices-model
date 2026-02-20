import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
import { Status } from './status';

describe('Status', () => {
    testEquatable({
        typeName: 'Status',
        createEqual: () => [
            Status.issued(),
            Status.issued(),
            Status.issued(),
        ],
        createDifferent: () => [Status.issued(), Status.cancelled()],
    });

    describe('issued', () => {
        it('should create a status with ISSUED value', () => {
            const status = Status.issued();

            expect(status.toString()).toBe('ISSUED');
        });
    });

    describe('processing', () => {
        it('should create a status with PROCESSING value', () => {
            const status = Status.processing();

            expect(status.toString()).toBe('PROCESSING');
        });
    });

    describe('cancelled', () => {
        it('should create a status with CANCELLED value', () => {
            const status = Status.cancelled();

            expect(status.toString()).toBe('CANCELLED');
        });
    });

    describe('paid', () => {
        it('should create a status with PAID value', () => {
            const status = Status.paid();

            expect(status.toString()).toBe('PAID');
        });
    });
});
