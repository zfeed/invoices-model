import { FinancialDocument } from '../../domain/document/document';
import { Session } from '../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { InMemoryDomainEvents } from '../../../../infrastructure/domain-events/in-memory-domain-events';
import { CanApproverApprove } from './can-approver-approve';
import { cleanDatabase } from '../../../../infrastructure/persistent-manager/clean-database';

const uuid = () => crypto.randomUUID();

const createDocumentFixture = (overrides: {
    approverId: string;
    referenceId?: string;
}) => {
    const ref = overrides.referenceId ?? uuid();
    return {
        document: FinancialDocument.fromPlain({
            id: uuid(),
            referenceId: ref,
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: uuid(),
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: uuid(),
                            order: 0,
                            groups: [
                                {
                                    id: uuid(),
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: overrides.approverId,
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
        referenceId: ref,
    };
};

describe('CanApproverApprove', () => {
    beforeEach(cleanDatabase);

    it('should return UNKNOWN when document does not exist', async () => {
        const session = new Session(
            new PersistentManager(new InMemoryDomainEvents())
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
            new PersistentManager(new InMemoryDomainEvents())
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
            new PersistentManager(new InMemoryDomainEvents())
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
            new PersistentManager(new InMemoryDomainEvents())
        );
        const approverId = uuid();
        const ref = uuid();
        const document = FinancialDocument.fromPlain({
            id: uuid(),
            referenceId: ref,
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: uuid(),
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: uuid(),
                            order: 0,
                            groups: [
                                {
                                    id: uuid(),
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: approverId,
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [
                                        {
                                            approverId,
                                            createdAt: new Date().toISOString(),
                                            comment: null,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
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
            .on(ref)
            .ask();

        expect(answer).toBe('NO');
    });

    it('should return NO when action does not exist on the document', async () => {
        const session = new Session(
            new PersistentManager(new InMemoryDomainEvents())
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
            new PersistentManager(new InMemoryDomainEvents())
        );
        const approverId1 = uuid();
        const approverId2 = uuid();
        const ref = uuid();

        const document = FinancialDocument.fromPlain({
            id: uuid(),
            referenceId: ref,
            value: { amount: '10000', currency: 'USD' },
            authflows: [
                {
                    id: uuid(),
                    action: 'pay',
                    range: {
                        from: { amount: '0', currency: 'USD' },
                        to: { amount: '100000', currency: 'USD' },
                    },
                    steps: [
                        {
                            id: uuid(),
                            order: 0,
                            groups: [
                                {
                                    id: uuid(),
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: approverId1,
                                            name: 'Alice',
                                            email: 'alice@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                        {
                            id: uuid(),
                            order: 1,
                            groups: [
                                {
                                    id: uuid(),
                                    requiredApprovals: 1,
                                    approvers: [
                                        {
                                            id: approverId2,
                                            name: 'Bob',
                                            email: 'bob@example.com',
                                        },
                                    ],
                                    approvals: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

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
