import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Action } from '../action/action';
import { Approver } from '../approver/approver';
import { Authflow } from '../authflow/authflow';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { Range } from '../range/range';
import { ReferenceId } from '../reference-id/reference-id';
import { FinancialDocument } from './document';
import { DocumentCreatedEvent } from './events/document-created.event';
import { DocumentApprovedEvent } from './events/document-approved.event';

const testMoney = Money.create('10000', 'USD').unwrap();
const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

const makeAuthflow = (
    id: string,
    action: string,
    stepsPlain: {
        id: string;
        order: number;
        groups: {
            id: string;
            approvers: { id: string; name: string; email: string }[];
            approvals: { approverId: string; createdAt: string; comment: string | null }[];
        }[];
    }[] = []
): Authflow =>
    Authflow.fromPlain({
        id,
        action,
        range: testRange.toPlain(),
        steps: stepsPlain,
    });

describe('createDocument', () => {
    it('should create a document successfully with unique authflow actions', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'reject'),
            makeAuthflow('3', 'review'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-001'),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
        expect(document.referenceId.toPlain()).toBe('INV-001');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with empty authflows', () => {
        const authflows: Authflow[] = [];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-002'),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(0);
        expect(document.referenceId.toPlain()).toBe('INV-002');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with a single authflow', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-003'),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(1);
        expect(document.authflows[0].action.toPlain()).toBe('approve');
    });

    it('should fail to create a document with duplicate authflow actions', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'reject'),
            makeAuthflow('3', 'approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-004'),
            value: testMoney,
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should fail when all authflows have the same action', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'approve'),
            makeAuthflow('3', 'approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-005'),
            value: testMoney,
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should fail when two authflows have the same action among unique ones', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'reject'),
            makeAuthflow('3', 'review'),
            makeAuthflow('4', 'reject'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-006'),
            value: testMoney,
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should treat action names as case-sensitive', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'Approve'),
            makeAuthflow('3', 'APPROVE'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-007'),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
    });

    it('should generate a unique id for the document', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
        ];

        const result1 = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-008'),
            value: testMoney,
            authflows,
        });

        const result2 = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-008'),
            value: testMoney,
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const document1 = result1.unwrap();
        const document2 = result2.unwrap();

        expect(document1.id).toBeDefined();
        expect(document2.id).toBeDefined();
        expect(document1.id.toPlain()).not.toBe(document2.id.toPlain());
    });

    it('should preserve authflow data in the created document', () => {
        const authflows: Authflow[] = [
            makeAuthflow('flow-1', 'approve'),
            makeAuthflow('flow-2', 'reject'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-009'),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows[0].id.toPlain()).toBe('flow-1');
        expect(document.authflows[0].action.toPlain()).toBe('approve');
        expect(document.authflows[1].id.toPlain()).toBe('flow-2');
        expect(document.authflows[1].action.toPlain()).toBe('reject');
    });

    it('should create a document with different referenceId formats', () => {
        const authflows: Authflow[] = [];

        const result1 = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain(''),
            value: testMoney,
            authflows,
        });

        const result2 = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('invoice-2024-001-special-chars_test'),
            value: testMoney,
            authflows,
        });

        const result3 = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('12345'),
            value: testMoney,
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result1.unwrap().referenceId.toPlain()).toBe('');
        expect(result2.unwrap().referenceId.toPlain()).toBe(
            'invoice-2024-001-special-chars_test'
        );
        expect(result3.unwrap().referenceId.toPlain()).toBe('12345');
    });

    it('should produce a DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-001'),
            value: testMoney,
            authflows,
        });

        const document = result.unwrap();
        expect(document.events).toHaveLength(1);
        expect(document.events[0]).toBeInstanceOf(DocumentCreatedEvent);
    });

    it('should include document data in the DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [
            makeAuthflow('1', 'approve'),
            makeAuthflow('2', 'reject'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.fromPlain('INV-010'),
            value: testMoney,
            authflows,
        });

        const document = result.unwrap();
        const event = document.events[0];
        const plain = document.toPlain();
        expect(event.data.id).toBe(plain.id);
        expect(event.data.referenceId).toBe('INV-010');
        expect(event.data.value).toEqual(testMoney.toPlain());
        expect(event.data.authflows).toEqual(plain.authflows);
    });
});

describe('approveDocument', () => {
    const approver1 = Approver.fromPlain({
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    });

    const approver2 = Approver.fromPlain({
        id: 'approver-2',
        name: 'Bob',
        email: 'bob@example.com',
    });

    const makeGroupPlain = (
        id: string,
        approvers: { id: string; name: string; email: string }[],
        isApproved: boolean
    ) => ({
        id,
        approvers,
        approvals: isApproved
            ? approvers.map((a) => ({
                  approverId: a.id,
                  createdAt: new Date().toISOString(),
                  comment: null,
              }))
            : [],
    });

    const makeStepPlain = (
        id: string,
        order: number,
        groups: ReturnType<typeof makeGroupPlain>[]
    ) => ({
        id,
        order,
        groups,
    });

    const makeAuthflowPlain = (
        id: string,
        action: string,
        steps: ReturnType<typeof makeStepPlain>[]
    ) => ({
        id,
        action,
        range: testRange.toPlain(),
        steps,
    });

    const makeDocument = (
        authflowsPlain: ReturnType<typeof makeAuthflowPlain>[]
    ): FinancialDocument =>
        FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: testMoney.toPlain(),
            authflows: authflowsPlain,

        });

    it('should approve a document with a single step and single group', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
    });

    it('should approve only the first unapproved step by order', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(false);
        expect(document.authflows[0].isApproved).toBe(false);
    });

    it('should pick the lowest-order unapproved step regardless of array order', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 5, [group1]);
        const step2 = makeStepPlain('step-2', 2, [group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        // step2 (order 2) should be approved, step1 (order 5) should remain
        const approvedStep = document.authflows[0].steps.find(
            (s) => s.order.toPlain() === 2
        );
        const unapprovedStep = document.authflows[0].steps.find(
            (s) => s.order.toPlain() === 5
        );
        expect(approvedStep!.isApproved).toBe(true);
        expect(unapprovedStep!.isApproved).toBe(false);
    });

    it('should fully approve authflow when last step is approved', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], true);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(true);
    });

    it('should not affect other authflows when approving one', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 0, [group2]);
        const authflow1 = makeAuthflowPlain('authflow-1', 'submit', [step1]);
        const authflow2 = makeAuthflowPlain('authflow-2', 'review', [step2]);
        const document = makeDocument([authflow1, authflow2]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[1].isApproved).toBe(false);
        expect(document.authflows[1].steps[0].isApproved).toBe(false);
    });

    it('should fail when action is not found', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('non-existent'), approver1);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe(
            'Authflow with action non-existent not found'
        );
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND
        );
    });

    it('should fail when all steps are already approved', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], true);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('No pending steps found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when approver is not in any group', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver2);

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should preserve document id after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe('doc-1');
    });

    it('should preserve all nested ids after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe('doc-1');
        expect(document.authflows[0].id.toPlain()).toBe('authflow-1');
        expect(document.authflows[0].steps[0].id.toPlain()).toBe('step-1');
        expect(document.authflows[0].steps[0].groups[0].id.toPlain()).toBe('group-1');
    });

    it('should preserve all ids across sequential approvals', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result1 = document.approve(Action.fromPlain('submit'), approver1);

        expect(result1.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe('doc-1');
        expect(document.authflows[0].id.toPlain()).toBe('authflow-1');
        expect(document.authflows[0].steps[0].id.toPlain()).toBe('step-1');
        expect(document.authflows[0].steps[1].id.toPlain()).toBe('step-2');

        const result2 = document.approve(Action.fromPlain('submit'), approver1);

        expect(result2.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe('doc-1');
        expect(document.authflows[0].id.toPlain()).toBe('authflow-1');
        expect(document.authflows[0].steps[0].id.toPlain()).toBe('step-1');
        expect(document.authflows[0].steps[1].id.toPlain()).toBe('step-2');
    });

    it('should preserve ids of unaffected authflows after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 0, [group2]);
        const authflow1 = makeAuthflowPlain('authflow-1', 'submit', [step1]);
        const authflow2 = makeAuthflowPlain('authflow-2', 'review', [step2]);
        const document = makeDocument([authflow1, authflow2]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].id.toPlain()).toBe('authflow-1');
        expect(document.authflows[1].id.toPlain()).toBe('authflow-2');
        expect(document.authflows[1].steps[0].id.toPlain()).toBe('step-2');
        expect(document.authflows[1].steps[0].groups[0].id.toPlain()).toBe('group-2');
    });

    it('should preserve document referenceId after approval', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.referenceId.toPlain()).toBe('INV-001');
    });

    it('should support sequential approvals across steps', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver1Plain], false);
        const step1 = makeStepPlain('step-1', 0, [group1]);
        const step2 = makeStepPlain('step-2', 1, [group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step1, step2]);
        const document = makeDocument([authflow]);

        // First approval -- step 1
        const result1 = document.approve(Action.fromPlain('submit'), approver1);

        expect(result1.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(false);
        expect(document.authflows[0].isApproved).toBe(false);

        // Second approval -- step 2
        const result2 = document.approve(Action.fromPlain('submit'), approver1);

        expect(result2.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
    });

    it('should handle multiple groups in a single step', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const approver2Plain = { id: 'approver-2', name: 'Bob', email: 'bob@example.com' };
        const group1 = makeGroupPlain('group-1', [approver1Plain], false);
        const group2 = makeGroupPlain('group-2', [approver2Plain], false);
        const step = makeStepPlain('step-1', 0, [group1, group2]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        // Approve first group
        const result1 = document.approve(Action.fromPlain('submit'), approver1);

        expect(result1.isOk()).toBe(true);
        // Step has 2 groups, only 1 approved
        expect(document.authflows[0].steps[0].groups).toHaveLength(2);

        // Approve second group
        const result2 = document.approve(Action.fromPlain('submit'), approver2);

        expect(result2.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
    });

    it('should produce a DocumentApprovedEvent', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        expect(document.events).toHaveLength(1);
        expect(document.events[0]).toBeInstanceOf(DocumentApprovedEvent);
    });

    it('should include approval data in the DocumentApprovedEvent', () => {
        const approver1Plain = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' };
        const group = makeGroupPlain('group-1', [approver1Plain], false);
        const step = makeStepPlain('step-1', 0, [group]);
        const authflow = makeAuthflowPlain('authflow-1', 'submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.approve(Action.fromPlain('submit'), approver1);

        expect(result.isOk()).toBe(true);
        const event = document.events[0];
        const plain = document.toPlain();
        expect(event.data.id).toBe('doc-1');
        expect(event.data.referenceId).toBe('INV-001');
        expect(event.data.value).toEqual(testMoney.toPlain());
        expect(event.data.authflows).toEqual(plain.authflows);
    });
});

describe('canApproverApprove', () => {
    it('should return true when approver is in the current step', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [{
                    id: 'step-1',
                    order: 0,
                    groups: [{
                        id: 'group-1',
                        approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                        approvals: [],
                    }],
                }],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-1')
        );

        expect(result).toBe(true);
    });

    it('should return false when action does not exist', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [{
                    id: 'step-1',
                    order: 0,
                    groups: [{
                        id: 'group-1',
                        approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                        approvals: [],
                    }],
                }],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('non-existent'),
            Id.fromPlain('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should return false when authflow is already approved', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [{
                    id: 'step-1',
                    order: 0,
                    groups: [{
                        id: 'group-1',
                        approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                        approvals: [{ approverId: 'approver-1', createdAt: new Date().toISOString(), comment: null }],
                    }],
                }],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should return false when approver is in a later step', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [
                    {
                        id: 'step-1',
                        order: 0,
                        groups: [{
                            id: 'group-1',
                            approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                            approvals: [],
                        }],
                    },
                    {
                        id: 'step-2',
                        order: 1,
                        groups: [{
                            id: 'group-2',
                            approvers: [{ id: 'approver-2', name: 'Bob', email: 'bob@example.com' }],
                            approvals: [],
                        }],
                    },
                ],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-2')
        );

        expect(result).toBe(false);
    });

    it('should return true when approver is in the current step after previous step is approved', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [
                    {
                        id: 'step-1',
                        order: 0,
                        groups: [{
                            id: 'group-1',
                            approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                            approvals: [{ approverId: 'approver-1', createdAt: new Date().toISOString(), comment: null }],
                        }],
                    },
                    {
                        id: 'step-2',
                        order: 1,
                        groups: [{
                            id: 'group-2',
                            approvers: [{ id: 'approver-2', name: 'Bob', email: 'bob@example.com' }],
                            approvals: [],
                        }],
                    },
                ],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-2')
        );

        expect(result).toBe(true);
    });

    it('should return false when approver is not in any group', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [{
                    id: 'step-1',
                    order: 0,
                    groups: [{
                        id: 'group-1',
                        approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                        approvals: [],
                    }],
                }],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('unknown-approver')
        );

        expect(result).toBe(false);
    });

    it('should return false when the approver group is already approved', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [{
                    id: 'step-1',
                    order: 0,
                    groups: [{
                        id: 'group-1',
                        approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                        approvals: [{ approverId: 'approver-1', createdAt: new Date().toISOString(), comment: null }],
                    }],
                }],
            }],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should pick the lowest-order unapproved step regardless of array order', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [{
                id: 'authflow-1',
                action: 'pay',
                range: { from: { amount: '0', currency: 'USD' }, to: { amount: '100000', currency: 'USD' } },
                steps: [
                    {
                        id: 'step-1',
                        order: 5,
                        groups: [{
                            id: 'group-1',
                            approvers: [{ id: 'approver-1', name: 'Alice', email: 'alice@example.com' }],
                            approvals: [],
                        }],
                    },
                    {
                        id: 'step-2',
                        order: 2,
                        groups: [{
                            id: 'group-2',
                            approvers: [{ id: 'approver-2', name: 'Bob', email: 'bob@example.com' }],
                            approvals: [],
                        }],
                    },
                ],
            }],
        });

        expect(
            document.canApproverApprove(Action.fromPlain('pay'), Id.fromPlain('approver-2'))
        ).toBe(true);

        expect(
            document.canApproverApprove(Action.fromPlain('pay'), Id.fromPlain('approver-1'))
        ).toBe(false);
    });

    it('should return false when document has no authflows', () => {
        const document = FinancialDocument.fromPlain({
            id: 'doc-1',
            referenceId: 'INV-001',
            value: { amount: '10000', currency: 'USD' },

            authflows: [],
        });

        const result = document.canApproverApprove(
            Action.fromPlain('pay'),
            Id.fromPlain('approver-1')
        );

        expect(result).toBe(false);
    });
});
