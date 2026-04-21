import { FinancialDocument } from '../../domain/document/document.ts';
import { Session } from '../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { defaultPersisters } from '../../../../platform/infrastructure/persistent-manager/default-persisters.ts';
import { InMemoryDomainEventsBus } from '../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { CanApproverApprove } from './can-approver-approve.ts';
import { cleanDatabase } from '../../../../platform/infrastructure/persistent-manager/clean-database.ts';
import { getTestKysely } from '../../../../../test/kysely.ts';
const kysely = getTestKysely();
import { Action } from '../../domain/action/action.ts';
import { Approval } from '../../domain/approval/approval.ts';
import { Approver } from '../../domain/approver/approver.ts';
import { Authflow } from '../../domain/authflow/authflow.ts';
import { Email } from '../../domain/email/email.ts';
import { Group } from '../../domain/groups/group.ts';
import { Id } from '../../domain/id/id.ts';
import { Money } from '../../domain/money/money.ts';
import { Name } from '../../domain/name/name.ts';
import { Order } from '../../domain/order/order.ts';
import { Range } from '../../domain/range/range.ts';
import { ReferenceId } from '../../domain/reference-id/reference-id.ts';
import { Step } from '../../domain/step/step.ts';

const uuid = () => crypto.randomUUID();

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

const makeApproval = (approverId: string) =>
    Approval.create({
        approverId: Id.fromString(approverId),
        comment: null,
    }).unwrap();

const createDocumentFixture = (overrides: {
    approverId: string;
    referenceId?: string;
}) => {
    const ref = overrides.referenceId ?? uuid();
    const approver = makeApprover(
        overrides.approverId,
        'Alice',
        'alice@example.com'
    );
    const group = Group.create({
        requiredApprovals: 1,
        approvers: [approver],
        approvals: [],
    }).unwrap();
    const step = Step.create({
        order: Order.create(0).unwrap(),
        groups: [group],
    }).unwrap();
    const authflow = Authflow.create({
        action: Action.create('pay').unwrap(),
        range: testRange,
        steps: [step],
    }).unwrap();
    const document = FinancialDocument.create({
        referenceId: ReferenceId.create(ref).unwrap(),
        value: Money.create('10000', 'USD').unwrap(),
        authflows: [authflow],
    }).unwrap();
    return {
        document,
        referenceId: ref,
    };
};

describe('CanApproverApprove', () => {
    beforeEach(() => cleanDatabase(kysely));

    it('should return UNKNOWN when document does not exist', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const question = new CanApproverApprove(session);

        const answer = await question
            .can(uuid())
            .perform('pay')
            .on('non-existent-ref')
            .ask();

        expect(answer).toBe('UNKNOWN');
    });

    it('should return YES when approver can approve the action', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const approverId = uuid();
        const { document, referenceId } = createDocumentFixture({
            approverId,
        });

        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const question = new CanApproverApprove(session);

        const answer = await question
            .can(approverId)
            .perform('pay')
            .on(referenceId)
            .ask();

        expect(answer).toBe('YES');
    });

    it('should return NO when approver is not in any group', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const approverId = uuid();
        const { document, referenceId } = createDocumentFixture({
            approverId,
        });

        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const question = new CanApproverApprove(session);

        const answer = await question
            .can(uuid())
            .perform('pay')
            .on(referenceId)
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when authflow is already approved', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const approverId = uuid();
        const ref = uuid();
        const approver = makeApprover(approverId, 'Alice', 'alice@example.com');
        const approval = makeApproval(approverId);
        const group = Group.create({
            requiredApprovals: 1,
            approvers: [approver],
            approvals: [approval],
        }).unwrap();
        const step = Step.create({
            order: Order.create(0).unwrap(),
            groups: [group],
        }).unwrap();
        const authflow = Authflow.create({
            action: Action.create('pay').unwrap(),
            range: testRange,
            steps: [step],
        }).unwrap();
        const document = FinancialDocument.create({
            referenceId: ReferenceId.create(ref).unwrap(),
            value: Money.create('10000', 'USD').unwrap(),
            authflows: [authflow],
        }).unwrap();

        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const question = new CanApproverApprove(session);

        const answer = await question
            .can(approverId)
            .perform('pay')
            .on(ref)
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when action does not exist on the document', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const approverId = uuid();
        const { document, referenceId } = createDocumentFixture({
            approverId,
        });

        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const question = new CanApproverApprove(session);

        const answer = await question
            .can(approverId)
            .perform('non-existent')
            .on(referenceId)
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when approver is in a later step', async () => {
        const session = new Session(
            new PersistentManager(
                kysely,
                new InMemoryDomainEventsBus(),
                EventOutboxStorage.create(kysely),
                defaultPersisters
            )
        );
        const approverId1 = uuid();
        const approverId2 = uuid();
        const ref = uuid();

        const approver1 = makeApprover(
            approverId1,
            'Alice',
            'alice@example.com'
        );
        const approver2 = makeApprover(approverId2, 'Bob', 'bob@example.com');
        const group1 = Group.create({
            requiredApprovals: 1,
            approvers: [approver1],
            approvals: [],
        }).unwrap();
        const group2 = Group.create({
            requiredApprovals: 1,
            approvers: [approver2],
            approvals: [],
        }).unwrap();
        const step1 = Step.create({
            order: Order.create(0).unwrap(),
            groups: [group1],
        }).unwrap();
        const step2 = Step.create({
            order: Order.create(1).unwrap(),
            groups: [group2],
        }).unwrap();
        const authflow = Authflow.create({
            action: Action.create('pay').unwrap(),
            range: testRange,
            steps: [step1, step2],
        }).unwrap();
        const document = FinancialDocument.create({
            referenceId: ReferenceId.create(ref).unwrap(),
            value: Money.create('10000', 'USD').unwrap(),
            authflows: [authflow],
        }).unwrap();

        {
            await using uow = await session.begin();
            await uow.collection(FinancialDocument).add(document);
            await uow.commit();
        }

        const question = new CanApproverApprove(session);

        const answer = await question
            .can(approverId2)
            .perform('pay')
            .on(ref)
            .ask();

        expect(answer).toBe('NO');
    });
});
