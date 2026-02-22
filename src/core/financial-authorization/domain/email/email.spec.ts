import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createEmail } from './email';

describe('Email', () => {
    describe('createEmail', () => {
        it('should create an email from a valid string', () => {
            const result = createEmail('john@example.com');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe('john@example.com');
        });

        it('should return an error for an invalid email', () => {
            const result = createEmail('not-an-email');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
            );
        });

        it('should return an error for an empty string', () => {
            const result = createEmail('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
            );
        });
    });
});
