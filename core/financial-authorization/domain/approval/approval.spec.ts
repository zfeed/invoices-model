import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
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

    it('should reject empty string comment', () => {
        const data = {
            approverId: 'user-001',
            comment: '',
        };

        const result = createApproval(data);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
        );
    });

    it('should reject whitespace-only comment', () => {
        const data = {
            approverId: 'user-001',
            comment: '   ',
        };

        const result = createApproval(data);

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
        );
    });

    it('should reject empty approverId', () => {
        const data = {
            approverId: '',
            comment: 'Approved',
        };

        const result = createApproval(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approver ID cannot be blank');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK
        );
    });

    it('should reject null approverId', () => {
        const data = {
            approverId: null as unknown as string,
            comment: 'Approved',
        };

        const result = createApproval(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approver ID cannot be blank');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK
        );
    });

    it('should reject whitespace-only approverId', () => {
        const data = {
            approverId: '   ',
            comment: 'Approved',
        };

        const result = createApproval(data);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approver ID cannot be blank');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_ID_BLANK
        );
    });
});

