import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Group } from './group';

describe('Group.create', () => {
    it('should create a group successfully with unique approvers', () => {
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
            Approver.fromPlain({ id: '3', name: 'Charlie', email: 'charlie@example.com' }),
        ];

        const approvals: Approval[] = [];

        const result = Group.create({
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

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
            Approver.fromPlain({ id: '1', name: 'Alice Duplicate', email: 'alice2@example.com' }),
        ];

        const approvals: Approval[] = [];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: 'same-id', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: 'same-id', name: 'Bob', email: 'bob@example.com' }),
            Approver.fromPlain({ id: 'same-id', name: 'Charlie', email: 'charlie@example.com' }),
        ];

        const approvals: Approval[] = [];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Approved' }),
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: null }),
        ];

        const result = Group.create({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvals).toHaveLength(2);
        expect(group.id).toBeDefined();
    });

    it('should fail to create a group with duplicate approval approver IDs', () => {
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({
                approverId: '1',
                createdAt: new Date().toISOString(),
                comment: 'Approved first time',
            }),
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: 'Approved' }),
            Approval.fromPlain({
                approverId: '1',
                createdAt: new Date().toISOString(),
                comment: 'Approved second time',
            }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({
                approverId: '1',
                createdAt: new Date().toISOString(),
                comment: 'First approval',
            }),
            Approval.fromPlain({
                approverId: '1',
                createdAt: new Date().toISOString(),
                comment: 'Second approval',
            }),
            Approval.fromPlain({
                approverId: '1',
                createdAt: new Date().toISOString(),
                comment: 'Third approval',
            }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Approved' }),
            Approval.fromPlain({ approverId: '3', createdAt: new Date().toISOString(), comment: 'Approved' }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '99', createdAt: new Date().toISOString(), comment: 'Approved' }),
            Approval.fromPlain({
                approverId: '100',
                createdAt: new Date().toISOString(),
                comment: 'Approved',
            }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
        ];

        const approvals: Approval[] = [];

        const result = Group.create({
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

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Approved' }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Valid' }),
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: 'Invalid' }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Valid' }),
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: 'Invalid' }),
            Approval.fromPlain({ approverId: '3', createdAt: new Date().toISOString(), comment: 'Also invalid' }),
        ];

        const result = Group.create({
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
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
            Approver.fromPlain({ id: '3', name: 'Charlie', email: 'charlie@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: 'Approved' }),
        ];

        const result = Group.create({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.approvals).toHaveLength(1);
    });

    it('should create a group when all approvers have approved', () => {
        const approvers = [
            Approver.fromPlain({ id: '1', name: 'Alice', email: 'alice@example.com' }),
            Approver.fromPlain({ id: '2', name: 'Bob', email: 'bob@example.com' }),
            Approver.fromPlain({ id: '3', name: 'Charlie', email: 'charlie@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({ approverId: '1', createdAt: new Date().toISOString(), comment: 'Approved' }),
            Approval.fromPlain({ approverId: '2', createdAt: new Date().toISOString(), comment: 'Looks good' }),
            Approval.fromPlain({ approverId: '3', createdAt: new Date().toISOString(), comment: null }),
        ];

        const result = Group.create({
            approvers,
            approvals,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.approvals).toHaveLength(3);
    });

    it('should fail when approver ID case does not match exactly', () => {
        const approvers = [
            Approver.fromPlain({ id: 'abc123', name: 'Alice', email: 'alice@example.com' }),
        ];

        const approvals = [
            Approval.fromPlain({
                approverId: 'ABC123',
                createdAt: new Date().toISOString(),
                comment: 'Approved',
            }),
        ];

        const result = Group.create({
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

describe('Group.apply', () => {
    const approver1 = Approver.fromPlain({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
    });

    const approver2 = Approver.fromPlain({
        id: '2',
        name: 'Bob',
        email: 'bob@example.com',
    });

    const approver3 = Approver.fromPlain({
        id: '3',
        name: 'Charlie',
        email: 'charlie@example.com',
    });

    const createApproval = (approverId: string) =>
        Approval.create({ approverId: Approver.fromPlain({ id: approverId, name: 'x', email: 'x@x.com' }).id, comment: null }).unwrap();

    it('should successfully add approval from existing approver', () => {
        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [],
        }).unwrap();

        const approval = createApproval('1');
        const result = group.apply(approval);

        expect(result.isOk()).toBe(true);

        const approvedGroup = result.unwrap();
        expect(approvedGroup.approvals).toHaveLength(1);
        expect(approvedGroup.approvals[0].approverId.toPlain()).toBe(approver1.id.toPlain());
        expect(approvedGroup.approvals[0].comment.toPlain()).toBe(null);
        expect(typeof approvedGroup.approvals[0].createdAt.toPlain()).toBe('string');
        expect(approvedGroup.isApproved).toBe(true);
        expect(approvedGroup.approvers).toHaveLength(2);
    });

    it('should not approve a group that already has approvals (already approved)', () => {
        const existingApproval = Approval.fromPlain({
            approverId: approver1.id.toPlain(),
            createdAt: new Date().toISOString(),
            comment: 'First approval',
        });

        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [existingApproval],
        }).unwrap();

        const approval = createApproval('2');
        const result = group.apply(approval);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver2.id.toPlain()}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should fail when approver is not in the group', () => {
        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [],
        }).unwrap();

        const approval = createApproval('3');
        const result = group.apply(approval);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver3.id.toPlain()}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should fail when approver tries to approve an already-approved group', () => {
        const existingApproval = Approval.fromPlain({
            approverId: approver1.id.toPlain(),
            createdAt: new Date().toISOString(),
            comment: 'First approval',
        });

        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [existingApproval],
        }).unwrap();

        const approval = createApproval('1');
        const result = group.apply(approval);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            `No eligible group found for approver ${approver1.id.toPlain()}`
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should maintain immutability of original group', () => {
        const originalGroup = Group.create({
            approvers: [approver1, approver2],
            approvals: [],
        }).unwrap();
        const originalApprovalsLength = originalGroup.approvals.length;
        const originalApproversLength = originalGroup.approvers.length;
        const originalIsApproved = originalGroup.isApproved;

        const approval = createApproval('1');
        originalGroup.apply(approval);

        expect(originalGroup.approvals).toHaveLength(originalApprovalsLength);
        expect(originalGroup.approvers).toHaveLength(originalApproversLength);
        expect(originalGroup.isApproved).toBe(originalIsApproved);
    });

    it('should set correct timestamp on approval', () => {
        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [],
        }).unwrap();

        const beforeTime = new Date();
        const approval = createApproval('1');
        const result = group.apply(approval);
        const afterTime = new Date();

        expect(result.isOk()).toBe(true);

        const approvedGroup = result.unwrap();
        const resultApproval = approvedGroup.approvals[0];
        const createdAtTime = new Date(resultApproval.createdAt.toPlain()).getTime();
        expect(createdAtTime).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(createdAtTime).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should work with single approver group', () => {
        const group = Group.create({
            approvers: [approver1],
            approvals: [],
        }).unwrap();

        const approval = createApproval('1');
        const result = group.apply(approval);

        expect(result.isOk()).toBe(true);

        const approvedGroup = result.unwrap();
        expect(approvedGroup.approvals).toHaveLength(1);
        expect(approvedGroup.approvals[0].approverId.toPlain()).toBe(approver1.id.toPlain());
        expect(approvedGroup.isApproved).toBe(true);
        expect(approvedGroup.approvers).toHaveLength(1);
    });

    it('should work with multiple approvers in sequence', () => {
        const group = Group.create({
            approvers: [approver1, approver2, approver3],
            approvals: [],
        }).unwrap();
        expect(group.isApproved).toBe(false);

        // First approval
        const approval1 = createApproval('1');
        const firstApprovalResult = group.apply(approval1);
        expect(firstApprovalResult.isOk()).toBe(true);
        const approvedGroup = firstApprovalResult.unwrap();
        expect(approvedGroup.approvals).toHaveLength(1);
        expect(approvedGroup.isApproved).toBe(true);

        // Second approval -- group is already approved, so this should fail
        const approval2 = createApproval('2');
        const secondApprovalResult = approvedGroup.apply(approval2);
        expect(secondApprovalResult.isError()).toBe(true);
    });

    it('should preserve group id after approval', () => {
        const group = Group.create({
            approvers: [approver1, approver2],
            approvals: [],
        }).unwrap();
        const originalId = group.id.toPlain();

        const approval = createApproval('1');
        const result = group.apply(approval);

        expect(result.isOk()).toBe(true);
        const approvedGroup = result.unwrap();
        expect(approvedGroup.id.toPlain()).toBe(originalId);
    });

    it('should preserve approver order when adding approval', () => {
        const group = Group.create({
            approvers: [approver1, approver2, approver3],
            approvals: [],
        }).unwrap();

        const approval = createApproval('2');
        const result = group.apply(approval);

        expect(result.isOk()).toBe(true);

        const approvedGroup = result.unwrap();
        expect(approvedGroup.approvers[0].id.toPlain()).toBe(approver1.id.toPlain());
        expect(approvedGroup.approvers[1].id.toPlain()).toBe(approver2.id.toPlain());
        expect(approvedGroup.approvers[2].id.toPlain()).toBe(approver3.id.toPlain());
        expect(approvedGroup.approvals[0].approverId.toPlain()).toBe(approver2.id.toPlain());
    });
});
