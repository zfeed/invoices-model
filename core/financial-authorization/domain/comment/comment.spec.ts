import { createComment } from './comment';

describe('Comment', () => {
    describe('createComment', () => {
        it('should create a comment from a string', () => {
            const comment = createComment('Looks good');
            expect(comment).toBe('Looks good');
        });

        it('should create a comment from null', () => {
            const comment = createComment(null);
            expect(comment).toBeNull();
        });
    });
});
