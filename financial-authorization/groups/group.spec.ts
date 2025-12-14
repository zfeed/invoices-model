import { DOMAIN_ERROR_CODE } from '../../building-blocks/errors/domain/domain-codes';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { createGroup } from './group';

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
