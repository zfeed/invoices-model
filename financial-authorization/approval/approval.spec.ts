import { createApproval } from './approval';

describe('createApproval', () => {
    it('should create an approval with a comment', () => {
        const data = {
            approverId: '123',
            comment: 'Looks good to me',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('123');
        expect(approval.comment).toBe('Looks good to me');
        expect(approval.createdAt).toBeInstanceOf(Date);
    });

    it('should create an approval with null comment', () => {
        const data = {
            approverId: '456',
            comment: null,
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('456');
        expect(approval.comment).toBeNull();
        expect(approval.createdAt).toBeInstanceOf(Date);
    });

    it('should set createdAt to current date', () => {
        const beforeCreation = new Date();
        const data = {
            approverId: '789',
            comment: 'Approved',
        };

        const result = createApproval(data);
        const afterCreation = new Date();

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.createdAt.getTime()).toBeGreaterThanOrEqual(
            beforeCreation.getTime()
        );
        expect(approval.createdAt.getTime()).toBeLessThanOrEqual(
            afterCreation.getTime()
        );
    });

    it('should create approval with empty string comment', () => {
        const data = {
            approverId: 'user-001',
            comment: '',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('user-001');
        expect(approval.comment).toBe('');
        expect(approval.createdAt).toBeInstanceOf(Date);
    });

    it('should create approval with long comment', () => {
        const longComment = 'A'.repeat(1000);
        const data = {
            approverId: 'user-002',
            comment: longComment,
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('user-002');
        expect(approval.comment).toBe(longComment);
        expect(approval.comment?.length).toBe(1000);
    });

    it('should create approval with special characters in approverId', () => {
        const data = {
            approverId: 'user-123-abc@example.com',
            comment: 'Approved',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('user-123-abc@example.com');
    });

    it('should create approval with multiline comment', () => {
        const data = {
            approverId: 'user-003',
            comment: 'Line 1\nLine 2\nLine 3',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.comment).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should create multiple approvals with unique timestamps', async () => {
        const data1 = { approverId: '1', comment: 'First' };
        const data2 = { approverId: '2', comment: 'Second' };

        const result1 = createApproval(data1);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
        const result2 = createApproval(data2);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const approval1 = result1.unwrap();
        const approval2 = result2.unwrap();

        expect(approval2.createdAt.getTime()).toBeGreaterThanOrEqual(
            approval1.createdAt.getTime()
        );
    });

    it('should create approval with UUID-style approverId', () => {
        const data = {
            approverId: '550e8400-e29b-41d4-a716-446655440000',
            comment: 'Approved',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should preserve exact comment content including whitespace', () => {
        const data = {
            approverId: 'user-004',
            comment: '  Comment with  multiple   spaces  ',
        };

        const result = createApproval(data);

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.comment).toBe('  Comment with  multiple   spaces  ');
    });
});

