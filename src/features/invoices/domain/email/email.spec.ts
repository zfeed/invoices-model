import { testEquatable } from '../../../../shared/equatable.test-helper';
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

    it('should return an error for an invalid email', () => {
        const result = Email.create('invalid-email');
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '6000',
            })
        );
    });

    it('should serialize to plain string', () => {
        const email = Email.create('test@example.com').unwrap();
        expect(email.toPlain()).toBe('test@example.com');
    });

    it('should reconstruct from plain', () => {
        const email = Email.create('test@example.com').unwrap();
        expect(email.toPlain()).toBe('test@example.com');
    });
});
