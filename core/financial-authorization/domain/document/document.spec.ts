import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Approver } from '../approver/approver';
import { Authflow } from '../authflow/authflow';
import { Group } from '../groups/group';
import { createMoney } from '../money/money';
import { createRange } from '../range/range';
import { Step } from '../step/step';
import { approveDocument, createDocument, FinancialDocument } from './document';
import { DocumentCreatedEvent } from './events/document-created.event';
import { DocumentApprovedEvent } from './events/document-approved.event';

const testMoney = createMoney('10000', 'USD').unwrap();
const testRange = createRange(
    createMoney('0', 'USD').unwrap(),
    createMoney('100000', 'USD').unwrap()
).unwrap();

describe('createDocument', () => {
    it('should create a document successfully with unique authflow actions', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'reject', range: testRange, isApproved: false, steps: [] },
            { id: '3', action: 'review', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-001',
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
        expect(document.referenceId).toBe('INV-001');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with empty authflows', () => {
        const authflows: Authflow[] = [];

        const result = createDocument({
            referenceId: 'INV-002',
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(0);
        expect(document.referenceId).toBe('INV-002');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with a single authflow', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: true, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-003',
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(1);
        expect(document.authflows[0].action).toBe('approve');
    });

    it('should fail to create a document with duplicate authflow actions', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'reject', range: testRange, isApproved: false, steps: [] },
            { id: '3', action: 'approve', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-004',
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
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '3', action: 'approve', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-005',
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
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'reject', range: testRange, isApproved: false, steps: [] },
            { id: '3', action: 'review', range: testRange, isApproved: false, steps: [] },
            { id: '4', action: 'reject', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-006',
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
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'Approve', range: testRange, isApproved: false, steps: [] },
            { id: '3', action: 'APPROVE', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-007',
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
    });

    it('should generate a unique id for the document', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
        ];

        const result1 = createDocument({
            referenceId: 'INV-008',
            value: testMoney,
            authflows,
        });

        const result2 = createDocument({
            referenceId: 'INV-008',
            value: testMoney,
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const document1 = result1.unwrap();
        const document2 = result2.unwrap();

        expect(document1.id).toBeDefined();
        expect(document2.id).toBeDefined();
        expect(document1.id).not.toBe(document2.id);
    });

    it('should preserve authflow data in the created document', () => {
        const authflows: Authflow[] = [
            { id: 'flow-1', action: 'approve', range: testRange, isApproved: true, steps: [] },
            { id: 'flow-2', action: 'reject', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-009',
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toEqual(authflows);
    });

    it('should create a document with different referenceId formats', () => {
        const authflows: Authflow[] = [];

        const result1 = createDocument({
            referenceId: '',
            value: testMoney,
            authflows,
        });

        const result2 = createDocument({
            referenceId: 'invoice-2024-001-special-chars_test',
            value: testMoney,
            authflows,
        });

        const result3 = createDocument({
            referenceId: '12345',
            value: testMoney,
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result1.unwrap().referenceId).toBe('');
        expect(result2.unwrap().referenceId).toBe(
            'invoice-2024-001-special-chars_test'
        );
        expect(result3.unwrap().referenceId).toBe('12345');
    });

    it('should produce a DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-001',
            value: testMoney,
            authflows,
        });

        const document = result.unwrap();
        expect(document.events).toHaveLength(1);
        expect(document.events[0]).toBeInstanceOf(DocumentCreatedEvent);
    });

    it('should include document data in the DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', range: testRange, isApproved: false, steps: [] },
            { id: '2', action: 'reject', range: testRange, isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-010',
            value: testMoney,
            authflows,
        });

        const document = result.unwrap();
        const event = document.events[0];
        expect(event.data.id).toBe(document.id);
        expect(event.data.referenceId).toBe('INV-010');
        expect(event.data.value).toEqual(testMoney);
        expect(event.data.authflows).toEqual(authflows);
        expect(event.data.version).toBe(0);
    });
});

describe('approveDocument', () => {
    const approver1: Approver = {
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    };

    const approver2: Approver = {
        id: 'approver-2',
        name: 'Bob',
        email: 'bob@example.com',
    };

    const makeGroup = (
        id: string,
        approvers: Approver[],
        isApproved: boolean
    ): Group => ({
        id,
        isApproved,
        approvers,
        approvals: isApproved
            ? approvers.map((a) => ({
                  approverId: a.id,
                  createdAt: new Date(),
                  comment: null,
              }))
            : [],
    });

    const makeStep = (
        id: string,
        order: number,
        groups: Group[],
        isApproved: boolean
    ): Step => ({
        id,
        order,
        isApproved,
        groups,
    });

    const makeAuthflow = (
        id: string,
        action: string,
        steps: Step[],
        isApproved: boolean
    ): Authflow => ({
        id,
        action,
        range: testRange,
        isApproved,
        steps,
    });

    const makeDocument = (authflows: Authflow[]): FinancialDocument => ({
        id: 'doc-1',
        referenceId: 'INV-001',
        value: testMoney,
        authflows,
        version: 0,
    });

    it('should approve a document with a single step and single group', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.authflows[0].isApproved).toBe(true);
        expect(updated.authflows[0].steps[0].isApproved).toBe(true);
    });

    it('should approve only the first unapproved step by order', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow = makeAuthflow(
            'authflow-1',
            'submit',
            [step1, step2],
            false
        );
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.authflows[0].steps[0].isApproved).toBe(true);
        expect(updated.authflows[0].steps[1].isApproved).toBe(false);
        expect(updated.authflows[0].isApproved).toBe(false);
    });

    it('should pick the lowest-order unapproved step regardless of array order', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 5, [group1], false);
        const step2 = makeStep('step-2', 2, [group2], false);
        const authflow = makeAuthflow(
            'authflow-1',
            'submit',
            [step1, step2],
            false
        );
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        // step2 (order 2) should be approved, step1 (order 5) should remain
        const approvedStep = updated.authflows[0].steps.find(
            (s) => s.order === 2
        );
        const unapprovedStep = updated.authflows[0].steps.find(
            (s) => s.order === 5
        );
        expect(approvedStep!.isApproved).toBe(true);
        expect(unapprovedStep!.isApproved).toBe(false);
    });

    it('should fully approve authflow when last step is approved', () => {
        const group1 = makeGroup('group-1', [approver1], true);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], true);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow = makeAuthflow(
            'authflow-1',
            'submit',
            [step1, step2],
            false
        );
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.authflows[0].isApproved).toBe(true);
        expect(updated.authflows[0].steps[0].isApproved).toBe(true);
        expect(updated.authflows[0].steps[1].isApproved).toBe(true);
    });

    it('should not affect other authflows when approving one', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 0, [group2], false);
        const authflow1 = makeAuthflow('authflow-1', 'submit', [step1], false);
        const authflow2 = makeAuthflow('authflow-2', 'review', [step2], false);
        const document = makeDocument([authflow1, authflow2]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.authflows[0].isApproved).toBe(true);
        expect(updated.authflows[1].isApproved).toBe(false);
        expect(updated.authflows[1].steps[0].isApproved).toBe(false);
    });

    it('should fail when action is not found', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'non-existent',
            approver: approver1,
        });

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
        const group = makeGroup('group-1', [approver1], true);
        const step = makeStep('step-1', 0, [group], true);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], true);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('No pending steps found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when approver is not in any group', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver2,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should preserve document id after approval', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.id).toBe('doc-1');
    });

    it('should preserve all nested ids after approval', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.id).toBe('doc-1');
        expect(updated.authflows[0].id).toBe('authflow-1');
        expect(updated.authflows[0].steps[0].id).toBe('step-1');
        expect(updated.authflows[0].steps[0].groups[0].id).toBe('group-1');
    });

    it('should preserve all ids across sequential approvals', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow = makeAuthflow(
            'authflow-1',
            'submit',
            [step1, step2],
            false
        );
        const document = makeDocument([authflow]);

        const result1 = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.id).toBe('doc-1');
        expect(afterFirst.authflows[0].id).toBe('authflow-1');
        expect(afterFirst.authflows[0].steps[0].id).toBe('step-1');
        expect(afterFirst.authflows[0].steps[1].id).toBe('step-2');

        const result2 = approveDocument({
            document: afterFirst,
            action: 'submit',
            approver: approver1,
        });

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.id).toBe('doc-1');
        expect(afterSecond.authflows[0].id).toBe('authflow-1');
        expect(afterSecond.authflows[0].steps[0].id).toBe('step-1');
        expect(afterSecond.authflows[0].steps[1].id).toBe('step-2');
    });

    it('should preserve ids of unaffected authflows after approval', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 0, [group2], false);
        const authflow1 = makeAuthflow('authflow-1', 'submit', [step1], false);
        const authflow2 = makeAuthflow('authflow-2', 'review', [step2], false);
        const document = makeDocument([authflow1, authflow2]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.authflows[0].id).toBe('authflow-1');
        expect(updated.authflows[1].id).toBe('authflow-2');
        expect(updated.authflows[1].steps[0].id).toBe('step-2');
        expect(updated.authflows[1].steps[0].groups[0].id).toBe('group-2');
    });

    it('should preserve document referenceId after approval', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result.isOk()).toBe(true);
        const updated = result.unwrap();
        expect(updated.referenceId).toBe('INV-001');
    });

    it('should support sequential approvals across steps', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver1], false);
        const step1 = makeStep('step-1', 0, [group1], false);
        const step2 = makeStep('step-2', 1, [group2], false);
        const authflow = makeAuthflow(
            'authflow-1',
            'submit',
            [step1, step2],
            false
        );
        const document = makeDocument([authflow]);

        // First approval — step 1
        const result1 = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        expect(afterFirst.authflows[0].steps[0].isApproved).toBe(true);
        expect(afterFirst.authflows[0].steps[1].isApproved).toBe(false);
        expect(afterFirst.authflows[0].isApproved).toBe(false);

        // Second approval — step 2
        const result2 = approveDocument({
            document: afterFirst,
            action: 'submit',
            approver: approver1,
        });

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.authflows[0].steps[0].isApproved).toBe(true);
        expect(afterSecond.authflows[0].steps[1].isApproved).toBe(true);
        expect(afterSecond.authflows[0].isApproved).toBe(true);
    });

    it('should handle multiple groups in a single step', () => {
        const group1 = makeGroup('group-1', [approver1], false);
        const group2 = makeGroup('group-2', [approver2], false);
        const step = makeStep('step-1', 0, [group1, group2], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        // Approve first group
        const result1 = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        expect(result1.isOk()).toBe(true);
        const afterFirst = result1.unwrap();
        // Step has 2 groups, only 1 approved
        expect(afterFirst.authflows[0].steps[0].groups).toHaveLength(2);

        // Approve second group
        const result2 = approveDocument({
            document: afterFirst,
            action: 'submit',
            approver: approver2,
        });

        expect(result2.isOk()).toBe(true);
        const afterSecond = result2.unwrap();
        expect(afterSecond.authflows[0].isApproved).toBe(true);
    });

    it('should produce a DocumentApprovedEvent', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        const updated = result.unwrap();
        expect(updated.events).toHaveLength(1);
        expect(updated.events[0]).toBeInstanceOf(DocumentApprovedEvent);
    });

    it('should include approval data in the DocumentApprovedEvent', () => {
        const group = makeGroup('group-1', [approver1], false);
        const step = makeStep('step-1', 0, [group], false);
        const authflow = makeAuthflow('authflow-1', 'submit', [step], false);
        const document = makeDocument([authflow]);

        const result = approveDocument({
            document,
            action: 'submit',
            approver: approver1,
        });

        const updated = result.unwrap();
        const event = updated.events[0];
        expect(event.data.id).toBe('doc-1');
        expect(event.data.referenceId).toBe('INV-001');
        expect(event.data.value).toEqual(testMoney);
        expect(event.data.authflows).toEqual(updated.authflows);
        expect(event.data.version).toBe(0);
    });
});
