import { KNOWN_ERROR_CODE } from '../../../building-blocks/errors/known-error-codes.ts';
import { Approver } from '../approver/approver.ts';
import { Email } from '../email/email.ts';
import { Id } from '../id/id.ts';
import { Name } from '../name/name.ts';
import { GroupTemplate } from './group-template.ts';

const makeApprover = (id: string, name: string, email: string) =>
    Approver.create({
        id: Id.fromString(id),
        name: Name.create(name).unwrap(),
        email: Email.create(email).unwrap(),
    }).unwrap();

describe('GroupTemplate.create', () => {
    it('should create a group template successfully with unique approvers', () => {
        const approvers = [
            makeApprover('1', 'Alice', 'alice@example.com'),
            makeApprover('2', 'Bob', 'bob@example.com'),
            makeApprover('3', 'Charlie', 'charlie@example.com'),
        ];

        const result = GroupTemplate.create({
            requiredApprovals: 1,
            approvers,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group.approvers).toHaveLength(3);
        expect(group.id).toBeDefined();
    });

    it('should fail to create a group template with empty approvers array', () => {
        const result = GroupTemplate.create({
            requiredApprovals: 1,
            approvers: [],
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Approvers array cannot be empty');
        expect(error.code).toBe(
            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY
        );
    });

    it('should fail to create a group template with duplicate approver IDs', () => {
        const approvers = [
            makeApprover('1', 'Alice', 'alice@example.com'),
            makeApprover('2', 'Bob', 'bob@example.com'),
            makeApprover('1', 'Alice Duplicate', 'alice2@example.com'),
        ];

        const result = GroupTemplate.create({
            requiredApprovals: 1,
            approvers,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate approver IDs found');
        expect(error.code).toBe(
            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE
        );
    });

    it('should generate a unique ID for each group template', () => {
        const approvers = [makeApprover('1', 'Alice', 'alice@example.com')];

        const result1 = GroupTemplate.create({
            requiredApprovals: 1,
            approvers,
        });
        const result2 = GroupTemplate.create({
            requiredApprovals: 1,
            approvers,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result1.unwrap().id.toPlain()).not.toBe(
            result2.unwrap().id.toPlain()
        );
    });

    it('should not have isApproved or approvals properties', () => {
        const approvers = [makeApprover('1', 'Alice', 'alice@example.com')];

        const result = GroupTemplate.create({
            requiredApprovals: 1,
            approvers,
        });

        expect(result.isOk()).toBe(true);
        const group = result.unwrap();
        expect(group).not.toHaveProperty('isApproved');
        expect(group).not.toHaveProperty('approvals');
    });
});
