import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes.ts';
import { Email } from './email.ts';

describe('Email', () => {
    describe('create', () => {
        it('should create an email from a valid string', () => {
            const result = Email.create('john@example.com');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe('john@example.com');
        });

        it('should return an error for an invalid email', () => {
            const result = Email.create('not-an-email');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
            );
        });

        it('should return an error for an empty string', () => {
            const result = Email.create('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
            );
        });
    });
});
