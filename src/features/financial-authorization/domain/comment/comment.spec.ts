import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes.ts';
import { Comment } from './comment.ts';

describe('Comment', () => {
    describe('create', () => {
        it('should create a comment from a string', () => {
            const result = Comment.create('Looks good');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe('Looks good');
        });

        it('should create a comment from null', () => {
            const result = Comment.create(null);
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBeNull();
        });

        it('should return an error for an empty string', () => {
            const result = Comment.create('');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
            );
        });

        it('should return an error for a whitespace-only string', () => {
            const result = Comment.create('   ');
            expect(result.isError()).toBe(true);
            expect(result.unwrapError().code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
            );
        });
    });
});
