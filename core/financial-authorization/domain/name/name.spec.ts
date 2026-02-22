import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createName } from './name';

describe('Name', () => {
    describe('createName', () => {
        it('should create a name from a string', () => {
            const result = createName('John Doe');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe('John Doe');
        });

        it('should return an error for an empty string', () => {
            const result = createName('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = createName('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
            );
        });
    });
});
