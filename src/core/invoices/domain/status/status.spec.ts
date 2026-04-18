import { testEquatable } from '../../../bulding-blocks/interfaces/equatable/equatable.test-helper.ts';
import { InvoiceStatus } from './invoice-status.ts';
import { DraftInvoiceStatus } from './draft-invoice-status.ts';

describe('InvoiceStatus', () => {
    testEquatable({
        typeName: 'InvoiceStatus',
        createEqual: () => [
            InvoiceStatus.issued(),
            InvoiceStatus.issued(),
            InvoiceStatus.issued(),
        ],
        createDifferent: () => [
            InvoiceStatus.issued(),
            InvoiceStatus.cancelled(),
        ],
    });

    describe('issued', () => {
        it('should create a status with ISSUED value', () => {
            const status = InvoiceStatus.issued();

            expect(status.toString()).toBe('ISSUED');
        });
    });

    describe('processing', () => {
        it('should create a status with PROCESSING value', () => {
            const status = InvoiceStatus.processing();

            expect(status.toString()).toBe('PROCESSING');
        });
    });

    describe('cancelled', () => {
        it('should create a status with CANCELLED value', () => {
            const status = InvoiceStatus.cancelled();

            expect(status.toString()).toBe('CANCELLED');
        });
    });

    describe('paid', () => {
        it('should create a status with PAID value', () => {
            const status = InvoiceStatus.paid();

            expect(status.toString()).toBe('PAID');
        });
    });

    describe('failed', () => {
        it('should create a status with FAILED value', () => {
            const status = InvoiceStatus.failed();

            expect(status.toString()).toBe('FAILED');
        });
    });
});

describe('DraftInvoiceStatus', () => {
    testEquatable({
        typeName: 'DraftInvoiceStatus',
        createEqual: () => [
            DraftInvoiceStatus.draft(),
            DraftInvoiceStatus.draft(),
            DraftInvoiceStatus.draft(),
        ],
        createDifferent: () => [
            DraftInvoiceStatus.draft(),
            DraftInvoiceStatus.completed(),
        ],
    });

    describe('draft', () => {
        it('should create a status with DRAFT value', () => {
            const status = DraftInvoiceStatus.draft();

            expect(status.toString()).toBe('DRAFT');
        });
    });

    describe('completed', () => {
        it('should create a status with COMPLETED value', () => {
            const status = DraftInvoiceStatus.completed();

            expect(status.toString()).toBe('COMPLETED');
        });
    });

    describe('archived', () => {
        it('should create a status with ARCHIVED value', () => {
            const status = DraftInvoiceStatus.archived();

            expect(status.toString()).toBe('ARCHIVED');
        });
    });
});
