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
});
