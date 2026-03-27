import { DOMAIN_ERROR_CODE } from '../../../../shared/errors/domain/domain-codes';
import { Action } from '../action/action';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Authflow } from '../authflow/authflow';
import { Email } from '../email/email';
import { Group } from '../groups/group';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { Name } from '../name/name';
import { Order } from '../order/order';
import { Range } from '../range/range';
import { ReferenceId } from '../reference-id/reference-id';
import { Step } from '../step/step';
import { FinancialDocument } from './document';
import { DocumentCreatedEvent } from './events/document-created.event';
import { DocumentApprovedEvent } from './events/document-approved.event';

const testMoney = Money.create('10000', 'USD').unwrap();
const testRange = Range.create(
    Money.create('0', 'USD').unwrap(),
    Money.create('100000', 'USD').unwrap()
).unwrap();

const makeApprover = (id: string, name: string, email: string) =>
    Approver.create({
        id: Id.fromString(id),
        name: Name.create(name).unwrap(),
        email: Email.create(email).unwrap(),
    }).unwrap();

const makeApproval = (approverId: string, comment: string | null = null) =>
    Approval.create({
        approverId: Id.fromString(approverId),
        comment,
    }).unwrap();

const makeGroup = (
    approvers: { id: string; name: string; email: string }[],
    approved: boolean
) =>
    Group.create({
        requiredApprovals: 1,
        approvers: approvers.map((a) => makeApprover(a.id, a.name, a.email)),
        approvals: approved ? approvers.map((a) => makeApproval(a.id)) : [],
    }).unwrap();

const makeStep = (order: number, groups: Group[]) =>
    Step.create({ order: Order.create(order).unwrap(), groups }).unwrap();

const makeAuthflow = (action: string, steps: Step[] = []): Authflow =>
    Authflow.create({
        action: Action.create(action).unwrap(),
        range: testRange,
        steps,
    }).unwrap();

describe('createDocument', () => {
    it('should create a document successfully with unique authflow actions', () => {
        const authflows: Authflow[] = [
            makeAuthflow('approve'),
            makeAuthflow('reject'),
            makeAuthflow('review'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-001').unwrap(),
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
            referenceId: ReferenceId.create('INV-002').unwrap(),
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
        const authflows: Authflow[] = [makeAuthflow('approve')];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-003').unwrap(),
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
            makeAuthflow('approve'),
            makeAuthflow('reject'),
            makeAuthflow('approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-004').unwrap(),
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
            makeAuthflow('approve'),
            makeAuthflow('approve'),
            makeAuthflow('approve'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-005').unwrap(),
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
            makeAuthflow('approve'),
            makeAuthflow('reject'),
            makeAuthflow('review'),
            makeAuthflow('reject'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-006').unwrap(),
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
            makeAuthflow('approve'),
            makeAuthflow('Approve'),
            makeAuthflow('APPROVE'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-007').unwrap(),
            value: testMoney,
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
    });

    it('should generate a unique id for the document', () => {
        const authflows: Authflow[] = [makeAuthflow('approve')];

        const result1 = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-008').unwrap(),
            value: testMoney,
            authflows,
        });

        const result2 = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-008').unwrap(),
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
        const authflow1 = makeAuthflow('approve');
        const authflow2 = makeAuthflow('reject');

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-009').unwrap(),
            value: testMoney,
            authflows: [authflow1, authflow2],
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows[0].id.toPlain()).toBe(authflow1.id.toPlain());
        expect(document.authflows[0].action.toPlain()).toBe('approve');
        expect(document.authflows[1].id.toPlain()).toBe(authflow2.id.toPlain());
        expect(document.authflows[1].action.toPlain()).toBe('reject');
    });

    it('should create a document with different referenceId formats', () => {
        const authflows: Authflow[] = [];

        const result1 = ReferenceId.create('');
        expect(result1.isError()).toBe(true);

        const result2 = FinancialDocument.create({
            referenceId: ReferenceId.create(
                'invoice-2024-001-special-chars_test'
            ).unwrap(),
            value: testMoney,
            authflows,
        });

        const result3 = FinancialDocument.create({
            referenceId: ReferenceId.create('12345').unwrap(),
            value: testMoney,
            authflows,
        });

        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result2.unwrap().referenceId.toPlain()).toBe(
            'invoice-2024-001-special-chars_test'
        );
        expect(result3.unwrap().referenceId.toPlain()).toBe('12345');
    });

    it('should produce a DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [makeAuthflow('approve')];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-001').unwrap(),
            value: testMoney,
            authflows,
        });

        const document = result.unwrap();
        expect(document.events).toHaveLength(1);
        expect(document.events[0]).toBeInstanceOf(DocumentCreatedEvent);
    });

    it('should include document data in the DocumentCreatedEvent', () => {
        const authflows: Authflow[] = [
            makeAuthflow('approve'),
            makeAuthflow('reject'),
        ];

        const result = FinancialDocument.create({
            referenceId: ReferenceId.create('INV-010').unwrap(),
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
    const approval1 = Approval.create({
        approverId: Id.fromString('approver-1'),
        comment: null,
    }).unwrap();
    const approval2 = Approval.create({
        approverId: Id.fromString('approver-2'),
        comment: null,
    }).unwrap();

    const approver1Plain = {
        id: 'approver-1',
        name: 'Alice',
        email: 'alice@example.com',
    };
    const approver2Plain = {
        id: 'approver-2',
        name: 'Bob',
        email: 'bob@example.com',
    };

    const makeTestGroup = (
        approvers: { id: string; name: string; email: string }[],
        isApproved: boolean
    ) =>
        Group.create({
            requiredApprovals: 1,
            approvers: approvers.map((a) =>
                makeApprover(a.id, a.name, a.email)
            ),
            approvals: isApproved
                ? approvers.map((a) => makeApproval(a.id))
                : [],
        }).unwrap();

    const makeTestStep = (order: number, groups: Group[]) =>
        Step.create({ order: Order.create(order).unwrap(), groups }).unwrap();

    const makeTestAuthflow = (action: string, steps: Step[]) =>
        Authflow.create({
            action: Action.create(action).unwrap(),
            range: testRange,
            steps,
        }).unwrap();

    const makeDocument = (authflows: Authflow[]): FinancialDocument =>
        FinancialDocument.create({
            referenceId: ReferenceId.create('INV-001').unwrap(),
            value: testMoney,
            authflows,
        }).unwrap();

    it('should approve a document with a single step and single group', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
    });

    it('should approve only the first unapproved step by order', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(false);
        expect(document.authflows[0].isApproved).toBe(false);
    });

    it('should pick the lowest-order unapproved step regardless of array order', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(5, [group1]);
        const step2 = makeTestStep(2, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

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
        const group1 = makeTestGroup([approver1Plain], true);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(true);
    });

    it('should not affect other authflows when approving one', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(0, [group2]);
        const authflow1 = makeTestAuthflow('submit', [step1]);
        const authflow2 = makeTestAuthflow('review', [step2]);
        const document = makeDocument([authflow1, authflow2]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
        expect(document.authflows[1].isApproved).toBe(false);
        expect(document.authflows[1].steps[0].isApproved).toBe(false);
    });

    it('should fail when action is not found', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('non-existent').unwrap(),
            approval1
        );

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
        const group = makeTestGroup([approver1Plain], true);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('No pending steps found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS
        );
    });

    it('should fail when approver is not in any group', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval2
        );

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND
        );
    });

    it('should preserve document id after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);
        const originalId = document.id.toPlain();

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe(originalId);
    });

    it('should preserve all nested ids after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);
        const originalDocId = document.id.toPlain();
        const originalAuthflowId = document.authflows[0].id.toPlain();
        const originalStepId = document.authflows[0].steps[0].id.toPlain();
        const originalGroupId =
            document.authflows[0].steps[0].groups[0].id.toPlain();

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe(originalDocId);
        expect(document.authflows[0].id.toPlain()).toBe(originalAuthflowId);
        expect(document.authflows[0].steps[0].id.toPlain()).toBe(
            originalStepId
        );
        expect(document.authflows[0].steps[0].groups[0].id.toPlain()).toBe(
            originalGroupId
        );
    });

    it('should preserve all ids across sequential approvals', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);
        const document = makeDocument([authflow]);
        const originalDocId = document.id.toPlain();
        const originalAuthflowId = document.authflows[0].id.toPlain();
        const originalStep1Id = document.authflows[0].steps[0].id.toPlain();
        const originalStep2Id = document.authflows[0].steps[1].id.toPlain();

        const result1 = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result1.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe(originalDocId);
        expect(document.authflows[0].id.toPlain()).toBe(originalAuthflowId);
        expect(document.authflows[0].steps[0].id.toPlain()).toBe(
            originalStep1Id
        );
        expect(document.authflows[0].steps[1].id.toPlain()).toBe(
            originalStep2Id
        );

        const result2 = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result2.isOk()).toBe(true);
        expect(document.id.toPlain()).toBe(originalDocId);
        expect(document.authflows[0].id.toPlain()).toBe(originalAuthflowId);
        expect(document.authflows[0].steps[0].id.toPlain()).toBe(
            originalStep1Id
        );
        expect(document.authflows[0].steps[1].id.toPlain()).toBe(
            originalStep2Id
        );
    });

    it('should preserve ids of unaffected authflows after approval', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(0, [group2]);
        const authflow1 = makeTestAuthflow('submit', [step1]);
        const authflow2 = makeTestAuthflow('review', [step2]);
        const document = makeDocument([authflow1, authflow2]);
        const originalAuthflow1Id = document.authflows[0].id.toPlain();
        const originalAuthflow2Id = document.authflows[1].id.toPlain();
        const originalStep2Id = document.authflows[1].steps[0].id.toPlain();
        const originalGroup2Id =
            document.authflows[1].steps[0].groups[0].id.toPlain();

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.authflows[0].id.toPlain()).toBe(originalAuthflow1Id);
        expect(document.authflows[1].id.toPlain()).toBe(originalAuthflow2Id);
        expect(document.authflows[1].steps[0].id.toPlain()).toBe(
            originalStep2Id
        );
        expect(document.authflows[1].steps[0].groups[0].id.toPlain()).toBe(
            originalGroup2Id
        );
    });

    it('should preserve document referenceId after approval', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.referenceId.toPlain()).toBe('INV-001');
    });

    it('should support sequential approvals across steps', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver1Plain], false);
        const step1 = makeTestStep(0, [group1]);
        const step2 = makeTestStep(1, [group2]);
        const authflow = makeTestAuthflow('submit', [step1, step2]);
        const document = makeDocument([authflow]);

        // First approval -- step 1
        const result1 = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result1.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(false);
        expect(document.authflows[0].isApproved).toBe(false);

        // Second approval -- step 2
        const result2 = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result2.isOk()).toBe(true);
        expect(document.authflows[0].steps[0].isApproved).toBe(true);
        expect(document.authflows[0].steps[1].isApproved).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
    });

    it('should handle multiple groups in a single step', () => {
        const group1 = makeTestGroup([approver1Plain], false);
        const group2 = makeTestGroup([approver2Plain], false);
        const step = makeTestStep(0, [group1, group2]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        // Approve first group
        const result1 = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result1.isOk()).toBe(true);
        // Step has 2 groups, only 1 approved
        expect(document.authflows[0].steps[0].groups).toHaveLength(2);

        // Approve second group
        const result2 = document.apply(
            Action.create('submit').unwrap(),
            approval2
        );

        expect(result2.isOk()).toBe(true);
        expect(document.authflows[0].isApproved).toBe(true);
    });

    it('should produce a DocumentApprovedEvent', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        expect(document.events).toHaveLength(2);
        expect(document.events[1]).toBeInstanceOf(DocumentApprovedEvent);
    });

    it('should include approval data in the DocumentApprovedEvent', () => {
        const group = makeTestGroup([approver1Plain], false);
        const step = makeTestStep(0, [group]);
        const authflow = makeTestAuthflow('submit', [step]);
        const document = makeDocument([authflow]);

        const result = document.apply(
            Action.create('submit').unwrap(),
            approval1
        );

        expect(result.isOk()).toBe(true);
        const event = document.events[1];
        const plain = document.toPlain();
        expect(event.data.id).toBe(document.id.toPlain());
        expect(event.data.referenceId).toBe('INV-001');
        expect(event.data.value).toEqual(testMoney.toPlain());
        expect(event.data.authflows).toEqual(plain.authflows);
    });
});

describe('canApproverApprove', () => {
    const makeTestApprover = (id: string, name: string, email: string) =>
        makeApprover(id, name, email);

    const makeTestApproval = (approverId: string) => makeApproval(approverId);

    const makeTestGroup2 = (
        approvers: Approver[],
        approvals: Approval[] = []
    ) =>
        Group.create({
            requiredApprovals: 1,
            approvers,
            approvals,
        }).unwrap();

    const makeTestStep2 = (order: number, groups: Group[]) =>
        Step.create({ order: Order.create(order).unwrap(), groups }).unwrap();

    const makeTestAuthflow2 = (action: string, steps: Step[]) =>
        Authflow.create({
            action: Action.create(action).unwrap(),
            range: testRange,
            steps,
        }).unwrap();

    const makeTestDocument = (authflows: Authflow[]) =>
        FinancialDocument.create({
            referenceId: ReferenceId.create('INV-001').unwrap(),
            value: Money.create('10000', 'USD').unwrap(),
            authflows,
        }).unwrap();

    it('should return true when approver is in the current step', () => {
        const approver = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const group = makeTestGroup2([approver]);
        const step = makeTestStep2(0, [group]);
        const authflow = makeTestAuthflow2('pay', [step]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-1')
        );

        expect(result).toBe(true);
    });

    it('should return false when action does not exist', () => {
        const approver = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const group = makeTestGroup2([approver]);
        const step = makeTestStep2(0, [group]);
        const authflow = makeTestAuthflow2('pay', [step]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('non-existent').unwrap(),
            Id.fromString('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should return false when authflow is already approved', () => {
        const approver = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const approval = makeTestApproval('approver-1');
        const group = makeTestGroup2([approver], [approval]);
        const step = makeTestStep2(0, [group]);
        const authflow = makeTestAuthflow2('pay', [step]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should return false when approver is in a later step', () => {
        const approver1 = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const approver2 = makeTestApprover(
            'approver-2',
            'Bob',
            'bob@example.com'
        );
        const group1 = makeTestGroup2([approver1]);
        const group2 = makeTestGroup2([approver2]);
        const step1 = makeTestStep2(0, [group1]);
        const step2 = makeTestStep2(1, [group2]);
        const authflow = makeTestAuthflow2('pay', [step1, step2]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-2')
        );

        expect(result).toBe(false);
    });

    it('should return true when approver is in the current step after previous step is approved', () => {
        const approver1 = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const approver2 = makeTestApprover(
            'approver-2',
            'Bob',
            'bob@example.com'
        );
        const approval1 = makeTestApproval('approver-1');
        const group1 = makeTestGroup2([approver1], [approval1]);
        const group2 = makeTestGroup2([approver2]);
        const step1 = makeTestStep2(0, [group1]);
        const step2 = makeTestStep2(1, [group2]);
        const authflow = makeTestAuthflow2('pay', [step1, step2]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-2')
        );

        expect(result).toBe(true);
    });

    it('should return false when approver is not in any group', () => {
        const approver = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const group = makeTestGroup2([approver]);
        const step = makeTestStep2(0, [group]);
        const authflow = makeTestAuthflow2('pay', [step]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('unknown-approver')
        );

        expect(result).toBe(false);
    });

    it('should return false when the approver group is already approved', () => {
        const approver = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const approval = makeTestApproval('approver-1');
        const group = makeTestGroup2([approver], [approval]);
        const step = makeTestStep2(0, [group]);
        const authflow = makeTestAuthflow2('pay', [step]);
        const document = makeTestDocument([authflow]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-1')
        );

        expect(result).toBe(false);
    });

    it('should pick the lowest-order unapproved step regardless of array order', () => {
        const approver1 = makeTestApprover(
            'approver-1',
            'Alice',
            'alice@example.com'
        );
        const approver2 = makeTestApprover(
            'approver-2',
            'Bob',
            'bob@example.com'
        );
        const group1 = makeTestGroup2([approver1]);
        const group2 = makeTestGroup2([approver2]);
        const step1 = makeTestStep2(5, [group1]);
        const step2 = makeTestStep2(2, [group2]);
        const authflow = makeTestAuthflow2('pay', [step1, step2]);
        const document = makeTestDocument([authflow]);

        expect(
            document.canApproverApprove(
                Action.create('pay').unwrap(),
                Id.fromString('approver-2')
            )
        ).toBe(true);

        expect(
            document.canApproverApprove(
                Action.create('pay').unwrap(),
                Id.fromString('approver-1')
            )
        ).toBe(false);
    });

    it('should return false when document has no authflows', () => {
        const document = makeTestDocument([]);

        const result = document.canApproverApprove(
            Action.create('pay').unwrap(),
            Id.fromString('approver-1')
        );

        expect(result).toBe(false);
    });
});
