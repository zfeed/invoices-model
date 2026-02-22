import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { createGroup, approveGroup } from './group';

describe('createGroup', () => {
    it('should create a group successfully with unique approvers', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '3', name: 'Charlie', email: 'charlie@example.com' },
        ];

        const approvals: Approval[] = [];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.isApproved).toBe(false);
        expect(group.id).toBeDefined();
    });

    it('should fail to create a group with empty approvers array', () => {
        const approvers: Approver[] = [];
        const approvals: Approval[] = [];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approvers array cannot be empty');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY
        );
    });

    it('should fail to create a group with duplicate approver IDs', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '1', name: 'Alice Duplicate', email: 'alice2@example.com' },
        ];

        const approvals: Approval[] = [];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE
        );
    });

    it('should fail when all approvers have the same ID', () => {
        const approvers: Approver[] = [
            { id: 'same-id', name: 'Alice', email: 'alice@example.com' },
            { id: 'same-id', name: 'Bob', email: 'bob@example.com' },
            { id: 'same-id', name: 'Charlie', email: 'charlie@example.com' },
        ];

        const approvals: Approval[] = [];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE
        );
    });

    it('should create a group successfully with unique approvals', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Approved' },
            { approverId: '2', createdAt: new Date(), comment: null },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvals).toHaveLength(2);
        expect(group.id).toBeDefined();
    });

    it('should fail to create a group with duplicate approval approver IDs', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];

        const approvals: Approval[] = [
            {
                approverId: '1',
                createdAt: new Date(),
                comment: 'Approved first time',
            },
            { approverId: '2', createdAt: new Date(), comment: 'Approved' },
            {
                approverId: '1',
                createdAt: new Date(),
                comment: 'Approved second time',
            },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found in approvals');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE
        );
    });

    it('should fail when all approvals have the same approver ID', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const approvals: Approval[] = [
            {
                approverId: '1',
                createdAt: new Date(),
                comment: 'First approval',
            },
            {
                approverId: '1',
                createdAt: new Date(),
                comment: 'Second approval',
            },
            {
                approverId: '1',
                createdAt: new Date(),
                comment: 'Third approval',
            },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found in approvals');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE
        );
    });

    it('should fail when approval references non-existent approver', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Approved' },
            { approverId: '3', createdAt: new Date(), comment: 'Approved' },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Approval references non-existent approver ID: 3'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });

    it('should fail when all approvals reference non-existent approvers', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '99', createdAt: new Date(), comment: 'Approved' },
            {
                approverId: '100',
                createdAt: new Date(),
                comment: 'Approved',
            },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Approval references non-existent approver ID: 99'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });

    it('should create a group with empty approvals and non-empty approvers', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];

        const approvals: Approval[] = [];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(2);
        expect(group.approvals).toHaveLength(0);
    });

    it('should fail when approvals exist but approvers array is empty', () => {
        const approvers: Approver[] = [];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Approved' },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approvers array cannot be empty');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY
        );
    });

    it('should fail when first approval is valid but second is invalid', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Valid' },
            { approverId: '2', createdAt: new Date(), comment: 'Invalid' },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Approval references non-existent approver ID: 2'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });

    it('should fail when multiple approvals reference non-existent approvers', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Valid' },
            { approverId: '2', createdAt: new Date(), comment: 'Invalid' },
            { approverId: '3', createdAt: new Date(), comment: 'Also invalid' },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Approval references non-existent approver ID: 2'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });

    it('should create a group when multiple valid approvers and only one is approved', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '3', name: 'Charlie', email: 'charlie@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '2', createdAt: new Date(), comment: 'Approved' },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.approvals).toHaveLength(1);
    });

    it('should create a group when all approvers have approved', () => {
        const approvers: Approver[] = [
            { id: '1', name: 'Alice', email: 'alice@example.com' },
            { id: '2', name: 'Bob', email: 'bob@example.com' },
            { id: '3', name: 'Charlie', email: 'charlie@example.com' },
        ];

        const approvals: Approval[] = [
            { approverId: '1', createdAt: new Date(), comment: 'Approved' },
            { approverId: '2', createdAt: new Date(), comment: 'Looks good' },
            { approverId: '3', createdAt: new Date(), comment: null },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.approvals).toHaveLength(3);
    });

    it('should fail when approver ID case does not match exactly', () => {
        const approvers: Approver[] = [
            { id: 'abc123', name: 'Alice', email: 'alice@example.com' },
        ];

        const approvals: Approval[] = [
            {
                approverId: 'ABC123',
                createdAt: new Date(),
                comment: 'Approved',
            },
        ];

        const result = createGroup({
            approvers,
            approvals,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Approval references non-existent approver ID: ABC123'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND
        );
    });
});

describe('approveGroup', () => {
    const approver1: Approver = {
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
    };

    const approver2: Approver = {
        id: '2',
        name: 'Bob',
        email: 'bob@example.com',
    };

    const approver3: Approver = {
        id: '3',
        name: 'Charlie',
        email: 'charlie@example.com',
    };

    it('should successfully add approval from existing approver', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [],
        });
        const group = groupResult.unwrap();

        const result = approveGroup([group], approver1);

        expect(result.isOk()).toBe(true);

        const approvedGroups = result.unwrap();
        const approvedGroup = approvedGroups.find(
            (g) => g.approvals.length > 0
        )!;
        expect(approvedGroup.approvals).toHaveLength(1);
        expect(approvedGroup.approvals[0].approverId).toBe(approver1.id);
        expect(approvedGroup.approvals[0].comment).toBe(null);
        expect(approvedGroup.approvals[0].createdAt).toBeInstanceOf(Date);
        expect(approvedGroup.isApproved).toBe(true);
        expect(approvedGroup.approvers).toHaveLength(2); // Should not change
    });

    it('should not approve a group that already has approvals (already approved)', () => {
        const existingApproval: Approval = {
            approverId: approver1.id,
            createdAt: new Date(),
            comment: 'First approval',
        };

        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [existingApproval],
        });
        const group = groupResult.unwrap();

        // Group is already approved (has approvals), so findGroup skips it
        const result = approveGroup([group], approver2);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver2.id}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should fail when approver is not in the group', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [],
        });
        const group = groupResult.unwrap();

        const result = approveGroup([group], approver3);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver3.id}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should fail when approver tries to approve an already-approved group', () => {
        const existingApproval: Approval = {
            approverId: approver1.id,
            createdAt: new Date(),
            comment: 'First approval',
        };

        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [existingApproval],
        });
        const group = groupResult.unwrap();

        // Group is already approved, so findGroup won't match it
        const result = approveGroup([group], approver1);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver1.id}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should maintain immutability of original group', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [],
        });
        const originalGroup = groupResult.unwrap();
        const originalApprovalsLength = originalGroup.approvals.length;
        const originalApproversLength = originalGroup.approvers.length;
        const originalIsApproved = originalGroup.isApproved;

        approveGroup([originalGroup], approver1);

        // Original group should remain unchanged
        expect(originalGroup.approvals).toHaveLength(originalApprovalsLength);
        expect(originalGroup.approvers).toHaveLength(originalApproversLength);
        expect(originalGroup.isApproved).toBe(originalIsApproved);
    });

    it('should set correct timestamp on approval', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [],
        });
        const group = groupResult.unwrap();

        const beforeTime = new Date();
        const result = approveGroup([group], approver1);
        const afterTime = new Date();

        expect(result.isOk()).toBe(true);

        const approvedGroups = result.unwrap();
        const approval = approvedGroups[0].approvals[0];
        expect(approval.createdAt).toBeInstanceOf(Date);
        expect(approval.createdAt.getTime()).toBeGreaterThanOrEqual(
            beforeTime.getTime()
        );
        expect(approval.createdAt.getTime()).toBeLessThanOrEqual(
            afterTime.getTime()
        );
    });

    it('should work with single approver group', () => {
        const groupResult = createGroup({
            approvers: [approver1],
            approvals: [],
        });
        const group = groupResult.unwrap();

        const result = approveGroup([group], approver1);

        expect(result.isOk()).toBe(true);

        const approvedGroups = result.unwrap();
        const approvedGroup = approvedGroups[0];
        expect(approvedGroup.approvals).toHaveLength(1);
        expect(approvedGroup.approvals[0].approverId).toBe(approver1.id);
        expect(approvedGroup.isApproved).toBe(true);
        expect(approvedGroup.approvers).toHaveLength(1);
    });

    it('should work with multiple approvers in sequence', () => {
        // Start with empty group
        const groupResult = createGroup({
            approvers: [approver1, approver2, approver3],
            approvals: [],
        });
        let currentGroups = [groupResult.unwrap()];
        expect(currentGroups[0].isApproved).toBe(false);

        // First approval
        const firstApprovalResult = approveGroup(currentGroups, approver1);
        expect(firstApprovalResult.isOk()).toBe(true);
        currentGroups = firstApprovalResult.unwrap();
        expect(currentGroups[0].approvals).toHaveLength(1);
        expect(currentGroups[0].isApproved).toBe(true);

        // Second approval — group is already approved, so approver2 won't find an eligible group
        // The contract finds groups where !g.isApproved, so this should fail
        const secondApprovalResult = approveGroup(currentGroups, approver2);
        expect(secondApprovalResult.isError()).toBe(true);
    });

    it('should preserve group id after approval', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2],
            approvals: [],
        });
        const group = groupResult.unwrap();
        const originalId = group.id;

        const result = approveGroup([group], approver1);

        expect(result.isOk()).toBe(true);
        const approvedGroups = result.unwrap();
        expect(approvedGroups[0].id).toBe(originalId);
    });

    it('should preserve approver order when adding approval', () => {
        const groupResult = createGroup({
            approvers: [approver1, approver2, approver3],
            approvals: [],
        });
        const group = groupResult.unwrap();

        const result = approveGroup([group], approver2);

        expect(result.isOk()).toBe(true);

        const approvedGroups = result.unwrap();
        const approvedGroup = approvedGroups[0];
        expect(approvedGroup.approvers[0].id).toBe(approver1.id);
        expect(approvedGroup.approvers[1].id).toBe(approver2.id);
        expect(approvedGroup.approvers[2].id).toBe(approver3.id);
        expect(approvedGroup.approvals[0].approverId).toBe(approver2.id);
    });
});
