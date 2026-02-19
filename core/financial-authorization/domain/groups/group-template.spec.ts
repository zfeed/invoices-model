import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approver } from '../approver/approver';
import { createGroupTemplate } from './group-template';

describe('createGroupTemplate', () => {
    it('should create a group template successfully with unique approvers', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '3', name: 'Charlie', email: 'charlie@example.com' },
        ];

        const result = createGroupTemplate({ approvers });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.id).toBeDefined();
    });

    it('should fail to create a group template with empty approvers array', () => {
        const result = createGroupTemplate({ approvers: [] });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approvers array cannot be empty');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY
        );
    });

    it('should fail to create a group template with duplicate approver IDs', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '1', name: 'Alice Duplicate', email: 'alice2@example.com' },
        ];

        const result = createGroupTemplate({ approvers });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE
        );
    });

    it('should generate a unique ID for each group template', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const result1 = createGroupTemplate({ approvers });
        const result2 = createGroupTemplate({ approvers });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id).not.toBe(result2.unwrap().id);
    });

    it('should not have isApproved or approvals properties', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const result = createGroupTemplate({ approvers });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group).not.toHaveProperty('isApproved');
        expect(group).not.toHaveProperty('approvals');
    });
});
