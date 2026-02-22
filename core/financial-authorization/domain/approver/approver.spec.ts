import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { createApprover } from './approver';

describe('createApprover', () => {
    it('should create an approver with valid data', () => {
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

    it('should generate valid UUID format for id', () => {
        const data = {
            name: 'UUID Test',
            email: 'uuid@example.com',
        };

        const result = createApprover(data);

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(approver.id).toMatch(uuidRegex);
    });

    it('should fail with invalid email', () => {
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

    it('should reject approver with empty name', () => {
        const data = {
            name: '',
            email: 'valid@example.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Name cannot be blank');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
        );
    });

    it('should reject approver with whitespace-only name', () => {
        const data = {
            name: '   ',
            email: 'valid@example.com',
        };

        const result = createApprover(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Name cannot be blank');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK
        );
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
});
