import { testEquatable } from '../../building-blocks/equatable.test-helper';
import { Email } from './email';

describe('Email', () => {
    testEquatable({
        typeName: 'Email',
        createEqual: () => [
            Email.create('test@example.com').unwrap(),
            Email.create('test@example.com').unwrap(),
            Email.create('test@example.com').unwrap(),
        ],
        createDifferent: () => [
            Email.create('test1@example.com').unwrap(),
            Email.create('test2@example.com').unwrap(),
        ],
    });

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
