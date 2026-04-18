import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import { Id } from '../id/id.ts';
import { Approval } from './approval.ts';

describe('Approval.create', () => {
    it('should create an approval with a comment', () => {
        const approverId = Id.fromString('123');

        const result = Approval.create({
            approverId,
            comment: 'Looks good to me',
        });

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId.toPlain()).toBe('123');
        expect(approval.comment.toPlain()).toBe('Looks good to me');
        expect(typeof approval.createdAt.toPlain()).toBe('string');
    });

    it('should create an approval with null comment', () => {
        const approverId = Id.fromString('456');

        const result = Approval.create({
            approverId,
            comment: null,
        });

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        expect(approval.approverId.toPlain()).toBe('456');
        expect(approval.comment.toPlain()).toBeNull();
        expect(typeof approval.createdAt.toPlain()).toBe('string');
    });

    it('should set createdAt to current date', () => {
        const beforeCreation = new Date();
        const approverId = Id.fromString('789');

        const result = Approval.create({
            approverId,
            comment: 'Approved',
        });
        const afterCreation = new Date();

        expect(result.isOk()).toBe(true);
        const approval = result.unwrap();
        const createdAtTime = new Date(approval.createdAt.toPlain()).getTime();
        expect(createdAtTime).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(createdAtTime).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should reject empty string comment', () => {
        const approverId = Id.fromString('user-001');

        const result = Approval.create({
            approverId,
            comment: '',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
        );
    });

    it('should reject whitespace-only comment', () => {
        const approverId = Id.fromString('user-001');

        const result = Approval.create({
            approverId,
            comment: '   ',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError().code).toBe(
            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_COMMENT_BLANK
        );
    });
});
