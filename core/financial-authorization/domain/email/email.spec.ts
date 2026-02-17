import { createEmail } from './email';

describe('Email', () => {
    describe('createEmail', () => {
        it('should create an email from a string', () => {
            const email = createEmail('john@example.com');
            expect(email).toBe('john@example.com');
        });
    });
});
