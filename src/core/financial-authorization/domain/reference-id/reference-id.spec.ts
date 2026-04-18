import { KNOWN_ERROR_CODE } from '../../../bulding-blocks/errors/known-error-codes.ts';
import { ReferenceId } from './reference-id.ts';

describe('ReferenceId', () => {
    describe('create', () => {
        it('should create a reference id from a string', () => {
            const result = ReferenceId.create('INV-001');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe('INV-001');
        });

        it('should return an error for an empty string', () => {
            const result = ReferenceId.create('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = ReferenceId.create('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK
            );
        });
    });
});
