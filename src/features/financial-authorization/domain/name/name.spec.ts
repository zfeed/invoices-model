import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes';
import { Name } from './name';

describe('Name', () => {
    describe('create', () => {
        it('should create a name from a string', () => {
            const result = Name.create('John Doe');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe('John Doe');
        });

        it('should return an error for an empty string', () => {
            const result = Name.create('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = Name.create('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
            );
        });
    });
});
