import { Email } from './email';

describe('Email', () => {
    it('should create an email', () => {
        const result = Email.create('recipient@example.com');
        const email = result.unwrap();
        expect(email.equals('recipient@example.com')).toBe(true);
    });

    it('should create an invalid email', () => {
        const result = Email.create('invalid-email');
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '6000',
            })
        );
    });
});
