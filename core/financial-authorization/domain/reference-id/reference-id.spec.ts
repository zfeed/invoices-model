import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createReferenceId } from './reference-id';

describe('ReferenceId', () => {
    describe('createReferenceId', () => {
        it('should create a reference id from a string', () => {
            const result = createReferenceId('INV-001');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe('INV-001');
        });

        it('should return an error for an empty string', () => {
            const result = createReferenceId('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = createReferenceId('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK
            );
        });
    });
});
