import { createMoney } from '../../domain/money/money';
import { createRange } from '../../domain/range/range';
import { createAuthflowTemplate } from '../../domain/authflow/authflow-template';
import {
    AuthflowPolicy,
    createAuthflowPolicy,
} from '../../domain/authflow/authflow-policy';
import { OptimisticConcurrencyError } from '../../../shared/optimistic-concurrency.error';
import { InMemoryPolicyStorage } from '../../../../infrastructure/storage/in-memory.policy-storage';

const range = (from: string, to: string) =>
    createRange(
        createMoney(from, 'USD').unwrap(),
        createMoney(to, 'USD').unwrap()
    ).unwrap();

const template = (from: string, to: string) =>
    createAuthflowTemplate({
        range: range(from, to),
        steps: [],
    }).unwrap();

const buildPolicy = (action: string): AuthflowPolicy =>
    createAuthflowPolicy({
        action,
        templates: [
            template('0', '999'),
            template('1000', '4999'),
            template('5000', '10000'),
        ],
    }).unwrap();

describe('PolicyStorage contract (InMemory)', () => {
    describe('findByAction', () => {
        it('should return Some.none when no policy exists for the given action', async () => {
            const storage = new InMemoryPolicyStorage();

            const result = await storage.findByAction('non-existing').run();

            expect(result.isNone()).toBe(true);
        });

        it('should return Some with the policy when it exists', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage.save(policy).run();

            const result = await storage.findByAction('approve-invoice').run();

            expect(result.isSome()).toBe(true);
            expect(
                result.fold(
                    () => null,
                    (p) => p.id
                )
            ).toBe(policy.id);
        });

        it('should return the policy with a persisted version', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            expect(policy.version).toBe(0);

            await storage.save(policy).run();

            const result = await storage.findByAction('approve-invoice').run();

            const retrieved = result.fold(
                () => null,
                (p) => p
            );

            expect(retrieved!.version).toBe(1);
        });

        it('should not return a policy saved under a different action', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage.save(policy).run();

            const result = await storage.findByAction('approve-transfer').run();

            expect(result.isNone()).toBe(true);
        });
    });

    describe('save', () => {
        it('should return Result.ok with the saved policy', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const result = await storage.save(policy).run();

            expect(result.isOk()).toBe(true);
            expect(result.unwrap().id).toBe(policy.id);
        });

        it('should return the policy with the new version after save', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const result = await storage.save(policy).run();

            expect(result.unwrap().version).toBe(1);
        });

        it('should increment version on each save', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const saved1 = (await storage.save(policy).run()).unwrap();
            expect(saved1.version).toBe(1);

            const saved2 = (await storage.save(saved1).run()).unwrap();
            expect(saved2.version).toBe(2);

            const saved3 = (await storage.save(saved2).run()).unwrap();
            expect(saved3.version).toBe(3);
        });

        it('should overwrite an existing policy with the same action', async () => {
            const storage = new InMemoryPolicyStorage();
            const original = buildPolicy('approve-invoice');

            const saved = (await storage.save(original).run()).unwrap();

            const updated = buildPolicy('approve-invoice');

            await storage
                .save({ ...updated, version: saved.version })
                .run();

            const result = await storage
                .findByAction('approve-invoice')
                .run();

            expect(
                result.fold(
                    () => null,
                    (p) => p.id
                )
            ).toBe(updated.id);
        });

        it('should store multiple policies with different actions independently', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy1 = buildPolicy('approve-invoice');
            const policy2 = buildPolicy('approve-transfer');

            await storage.save(policy1).run();
            await storage.save(policy2).run();

            const result1 = await storage
                .findByAction('approve-invoice')
                .run();
            const result2 = await storage
                .findByAction('approve-transfer')
                .run();

            expect(result1.isSome()).toBe(true);
            expect(result2.isSome()).toBe(true);
            expect(
                result1.fold(
                    () => null,
                    (p) => p.id
                )
            ).toBe(policy1.id);
            expect(
                result2.fold(
                    () => null,
                    (p) => p.id
                )
            ).toBe(policy2.id);
        });
    });

    describe('laziness', () => {
        it('should not execute save until run is called', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const io = storage.save(policy);

            const result = await storage
                .findByAction('approve-invoice')
                .run();
            expect(result.isNone()).toBe(true);

            await io.run();

            const resultAfterRun = await storage
                .findByAction('approve-invoice')
                .run();
            expect(resultAfterRun.isSome()).toBe(true);
        });
    });

    describe('isolation', () => {
        it('should not share state between different storage instances', async () => {
            const storage1 = new InMemoryPolicyStorage();
            const storage2 = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage1.save(policy).run();

            const result = await storage2
                .findByAction('approve-invoice')
                .run();

            expect(result.isNone()).toBe(true);
        });
    });

    describe('policy integrity', () => {
        it('should preserve templates when saving and retrieving a policy', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage.save(policy).run();

            const result = await storage
                .findByAction('approve-invoice')
                .run();

            const retrieved = result.fold(
                () => null,
                (p) => p
            );

            expect(retrieved).not.toBeNull();
            expect(retrieved!.action).toBe('approve-invoice');
            expect(retrieved!.templates).toHaveLength(3);
            expect(retrieved!.templates[0].range.from.amount).toBe('0');
            expect(retrieved!.templates[0].range.to.amount).toBe('999');
            expect(retrieved!.templates[2].range.from.amount).toBe('5000');
            expect(retrieved!.templates[2].range.to.amount).toBe('10000');
        });
    });

    describe('optimistic concurrency', () => {
        it('should save successfully when version matches', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const saved = (await storage.save(policy).run()).unwrap();

            const result = await storage.save(saved).run();

            expect(result.isOk()).toBe(true);
        });

        it('should allow sequential save cycles using returned versions', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const saved1 = (await storage.save(policy).run()).unwrap();
            const saved2 = (await storage.save(saved1).run()).unwrap();
            (await storage.save(saved2).run()).unwrap();

            const result = await storage
                .findByAction('approve-invoice')
                .run();

            expect(
                result.fold(
                    () => null,
                    (p) => p.version
                )
            ).toBe(3);
        });

        it('should throw OptimisticConcurrencyError when version is stale', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            const saved = (await storage.save(policy).run()).unwrap();

            await storage.save(saved).run();

            await expect(storage.save(saved).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should throw OptimisticConcurrencyError when saving a new policy with an action that already exists', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage.save(policy).run();

            const duplicate = buildPolicy('approve-invoice');

            expect(duplicate.version).toBe(0);

            await expect(storage.save(duplicate).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should throw OptimisticConcurrencyError when two concurrent readers both try to save', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy = buildPolicy('approve-invoice');

            await storage.save(policy).run();

            const read1 = (
                await storage.findByAction('approve-invoice').run()
            ).fold(
                () => null,
                (p) => p
            )!;

            const read2 = (
                await storage.findByAction('approve-invoice').run()
            ).fold(
                () => null,
                (p) => p
            )!;

            expect(read1.version).toBe(read2.version);

            await storage.save(read1).run();

            await expect(storage.save(read2).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should not affect concurrency of independent actions', async () => {
            const storage = new InMemoryPolicyStorage();
            const policy1 = buildPolicy('approve-invoice');
            const policy2 = buildPolicy('approve-transfer');

            const saved1 = (await storage.save(policy1).run()).unwrap();
            const saved2 = (await storage.save(policy2).run()).unwrap();

            const result1 = await storage.save(saved1).run();
            const result2 = await storage.save(saved2).run();

            expect(result1.isOk()).toBe(true);
            expect(result2.isOk()).toBe(true);
        });
    });
});
