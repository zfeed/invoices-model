import { DOMAIN_ERROR_CODE } from '../../building-blocks/errors/domain/domain-codes';
import { createApprover } from './approver';

describe('createApprover', () => {
    it('should create an approver with valid email', () => {
        const data = {
            name: 'John Doe',
            email: 'john.doe@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe('John Doe');
        expect(approver.email).toBe('john.doe@example.com');
        expect(approver.id).toBeDefined();
        expect(typeof approver.id).toBe('string');
        expect(approver.id.length).toBeGreaterThan(0);
    });

    it('should generate a unique ID for each approver', () => {
        const data = {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
        };

        const result1 = createApprover(data);
        const result2 = createApprover(data);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const approver1 = result1.unwrap();
        const approver2 = result2.unwrap();

        expect(approver1.id).not.toBe(approver2.id);
    });

    it('should fail with invalid email format', () => {
        const data = {
            name: 'Invalid User',
            email: 'not-an-email',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
        );
    });

    it('should fail with empty email', () => {
        const data = {
            name: 'Empty Email User',
            email: '',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT
        );
    });

    it('should fail with email missing @ symbol', () => {
        const data = {
            name: 'No At Symbol',
            email: 'invalidemail.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });

    it('should fail with email missing domain', () => {
        const data = {
            name: 'No Domain',
            email: 'user@',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });

    it('should fail with email missing local part', () => {
        const data = {
            name: 'No Local Part',
            email: '@example.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });

    it('should accept email with subdomain', () => {
        const data = {
            name: 'Subdomain User',
            email: 'user@mail.example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('user@mail.example.com');
    });

    it('should accept email with plus sign', () => {
        const data = {
            name: 'Plus User',
            email: 'user+test@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('user+test@example.com');
    });

    it('should accept email with dots in local part', () => {
        const data = {
            name: 'Dotted User',
            email: 'first.last@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('first.last@example.com');
    });

    it('should accept email with numbers', () => {
        const data = {
            name: 'Numbered User',
            email: 'user123@example456.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('user123@example456.com');
    });

    it('should accept email with hyphens in domain', () => {
        const data = {
            name: 'Hyphen Domain User',
            email: 'user@my-company.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('user@my-company.com');
    });

    it('should create approver with empty name', () => {
        const data = {
            name: '',
            email: 'valid@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe('');
        expect(approver.email).toBe('valid@example.com');
    });

    it('should create approver with long name', () => {
        const longName = 'A'.repeat(500);
        const data = {
            name: longName,
            email: 'user@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe(longName);
        expect(approver.name.length).toBe(500);
    });

    it('should create approver with special characters in name', () => {
        const data = {
            name: "O'Brien-Smith (Sr.)",
            email: 'obrien@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe("O'Brien-Smith (Sr.)");
    });

    it('should create approver with unicode characters in name', () => {
        const data = {
            name: 'José García',
            email: 'jose@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe('José García');
    });

    it('should preserve whitespace in name', () => {
        const data = {
            name: '  John   Doe  ',
            email: 'john@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name).toBe('  John   Doe  ');
    });

    it('should fail with email containing spaces', () => {
        const data = {
            name: 'Space User',
            email: 'user name@example.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });

    it('should fail with multiple @ symbols', () => {
        const data = {
            name: 'Double At User',
            email: 'user@@example.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });

    it('should generate valid UUID format for id', () => {
        const data = {
            name: 'UUID Test',
            email: 'uuid@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(approver.id).toMatch(uuidRegex);
    });

    it('should accept email with uppercase letters', () => {
        const data = {
            name: 'Uppercase User',
            email: 'User@Example.COM',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('User@Example.COM');
    });

    it('should accept short email addresses', () => {
        const data = {
            name: 'Short Email',
            email: 'a@b.co',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.email).toBe('a@b.co');
    });

    it('should fail with invalid TLD', () => {
        const data = {
            name: 'Invalid TLD',
            email: 'user@example',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Invalid email');
    });
});
