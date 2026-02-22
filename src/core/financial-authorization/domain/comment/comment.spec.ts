import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createComment } from './comment';

describe('Comment', () => {
    describe('createComment', () => {
        it('should create a comment from a string', () => {
            const result = createComment('Looks good');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe('Looks good');
        });

        it('should create a comment from null', () => {
            const result = createComment(null);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBeNull();
        });

        it('should return an error for an empty string', () => {
            const result = createComment('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = createComment('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
            );
        });
    });
});
