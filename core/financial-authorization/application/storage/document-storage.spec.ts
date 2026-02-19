import {
    createDocument,
    FinancialDocument,
} from '../../domain/document/document';
import { createAuthflow } from '../../domain/authflow/authflow';
import { createStep } from '../../domain/step/step';
import { createGroup } from '../../domain/groups/group';
import { createApprover } from '../../domain/approver/approver';
import { createMoney } from '../../domain/money/money';
import { OptimisticConcurrencyError } from '../../../shared/optimistic-concurrency.error';
import { InMemoryDocumentStorage } from '../../../../infrastructure/storage/in-memory.document-storage';

const testMoney = createMoney('10000', 'USD').unwrap();

const buildDocumentWithAuthflows = (): FinancialDocument => {
    const approver = createApprover({
        name: 'John Doe',
        email: 'john@example.com',
    }).unwrap();

    const group = createGroup({
        approvers: [approver],
        approvals: [],
    }).unwrap();

    const step = createStep({ order: 0, groups: [group] }).unwrap();

    const authflow = createAuthflow({
        action: 'approve-payment',
        steps: [step],
    }).unwrap();

    return createDocument({
        referenceId: 'ref-1',
        value: testMoney,
        authflows: [authflow],
    }).unwrap();
};

describe('DocumentStorage contract (InMemory)', () => {
    describe('findByReferenceId', () => {
        it('should return Some.none when no document exists for the given referenceId', async () => {
            const storage = new InMemoryDocumentStorage();

            const result = await storage
                .findByReferenceId('non-existing-ref')
                .run();

            expect(result.isNone()).toBe(true);
        });

        it('should return Some with the document when it exists', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save(document).run();

            const result = await storage.findByReferenceId('ref-1').run();

            expect(result.isSome()).toBe(true);
            expect(
                result.fold(
                    () => null,
                    (doc) => doc.id
                )
            ).toBe(document.id);
        });

        it('should return the document with a persisted version', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            expect(document.version).toBe(0);

            await storage.save(document).run();

            const result = await storage.findByReferenceId('ref-1').run();

            const retrieved = result.fold(
                () => null,
                (doc) => doc
            );

            expect(retrieved!.version).toBe(1);
        });

        it('should not return a document saved under a different referenceId', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save(document).run();

            const result = await storage.findByReferenceId('ref-2').run();

            expect(result.isNone()).toBe(true);
        });
    });

    describe('save', () => {
        it('should return Result.ok with the saved document', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const result = await storage.save(document).run();

            expect(result.isOk()).toBe(true);
            expect(result.unwrap().id).toBe(document.id);
        });

        it('should return the document with the new version after save', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const result = await storage.save(document).run();

            expect(result.unwrap().version).toBe(1);
        });

        it('should increment version on each save', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved1 = (await storage.save(document).run()).unwrap();
            expect(saved1.version).toBe(1);

            const saved2 = (await storage.save(saved1).run()).unwrap();
            expect(saved2.version).toBe(2);

            const saved3 = (await storage.save(saved2).run()).unwrap();
            expect(saved3.version).toBe(3);
        });

        it('should overwrite an existing document with the same referenceId', async () => {
            const storage = new InMemoryDocumentStorage();
            const original = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved = (await storage.save(original).run()).unwrap();

            const updated = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save({ ...updated, version: saved.version }).run();

            const result = await storage.findByReferenceId('ref-1').run();

            expect(
                result.fold(
                    () => null,
                    (doc) => doc.id
                )
            ).toBe(updated.id);
        });

        it('should store multiple documents with different referenceIds independently', async () => {
            const storage = new InMemoryDocumentStorage();
            const doc1 = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();
            const doc2 = createDocument({
                referenceId: 'ref-2',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save(doc1).run();
            await storage.save(doc2).run();

            const result1 = await storage.findByReferenceId('ref-1').run();
            const result2 = await storage.findByReferenceId('ref-2').run();

            expect(result1.isSome()).toBe(true);
            expect(result2.isSome()).toBe(true);
            expect(
                result1.fold(
                    () => null,
                    (doc) => doc.id
                )
            ).toBe(doc1.id);
            expect(
                result2.fold(
                    () => null,
                    (doc) => doc.id
                )
            ).toBe(doc2.id);
        });
    });

    describe('laziness', () => {
        it('should not execute save until run is called', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const io = storage.save(document);

            const result = await storage.findByReferenceId('ref-1').run();
            expect(result.isNone()).toBe(true);

            await io.run();

            const resultAfterRun = await storage
                .findByReferenceId('ref-1')
                .run();
            expect(resultAfterRun.isSome()).toBe(true);
        });
    });

    describe('isolation', () => {
        it('should not share state between different storage instances', async () => {
            const storage1 = new InMemoryDocumentStorage();
            const storage2 = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage1.save(document).run();

            const result = await storage2.findByReferenceId('ref-1').run();

            expect(result.isNone()).toBe(true);
        });
    });

    describe('document integrity', () => {
        it('should preserve authflows when saving and retrieving a document', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = buildDocumentWithAuthflows();

            await storage.save(document).run();

            const result = await storage.findByReferenceId('ref-1').run();

            const retrieved = result.fold(
                () => null,
                (doc) => doc
            );

            expect(retrieved).not.toBeNull();
            expect(retrieved!.authflows).toHaveLength(1);
            expect(retrieved!.authflows[0].action).toBe('approve-payment');
            expect(retrieved!.authflows[0].steps).toHaveLength(1);
            expect(retrieved!.authflows[0].steps[0].groups).toHaveLength(1);
            expect(
                retrieved!.authflows[0].steps[0].groups[0].approvers
            ).toHaveLength(1);
            expect(
                retrieved!.authflows[0].steps[0].groups[0].approvers[0].name
            ).toBe('John Doe');
        });
    });

    describe('optimistic concurrency', () => {
        it('should save successfully when version matches', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved = (await storage.save(document).run()).unwrap();

            const result = await storage.save(saved).run();

            expect(result.isOk()).toBe(true);
        });

        it('should allow sequential save cycles using returned versions', async () => {
            const storage = new InMemoryDocumentStorage();
            const doc = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved1 = (await storage.save(doc).run()).unwrap();
            const saved2 = (await storage.save(saved1).run()).unwrap();
            const saved3 = (await storage.save(saved2).run()).unwrap();

            const result = await storage.findByReferenceId('ref-1').run();

            expect(
                result.fold(
                    () => null,
                    (doc) => doc.version
                )
            ).toBe(3);
        });

        it('should throw OptimisticConcurrencyError when version is stale', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved = (await storage.save(document).run()).unwrap();

            // First update succeeds and bumps version
            await storage.save(saved).run();

            // Second update with the same (now stale) version fails
            await expect(storage.save(saved).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should throw OptimisticConcurrencyError when saving a new document with a referenceId that already exists', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save(document).run();

            const duplicate = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            expect(duplicate.version).toBe(0);

            await expect(storage.save(duplicate).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should throw OptimisticConcurrencyError when two concurrent readers both try to save', async () => {
            const storage = new InMemoryDocumentStorage();
            const document = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();

            await storage.save(document).run();

            // Two concurrent reads get the same version
            const read1 = (await storage.findByReferenceId('ref-1').run()).fold(
                () => null,
                (doc) => doc
            )!;

            const read2 = (await storage.findByReferenceId('ref-1').run()).fold(
                () => null,
                (doc) => doc
            )!;

            expect(read1.version).toBe(read2.version);

            // First writer succeeds
            await storage.save(read1).run();

            // Second writer fails — version has moved forward
            await expect(storage.save(read2).run()).rejects.toThrow(
                OptimisticConcurrencyError
            );
        });

        it('should not affect concurrency of independent referenceIds', async () => {
            const storage = new InMemoryDocumentStorage();
            const doc1 = createDocument({
                referenceId: 'ref-1',
                value: testMoney,
                authflows: [],
            }).unwrap();
            const doc2 = createDocument({
                referenceId: 'ref-2',
                value: testMoney,
                authflows: [],
            }).unwrap();

            const saved1 = (await storage.save(doc1).run()).unwrap();
            const saved2 = (await storage.save(doc2).run()).unwrap();

            // Saving both with their correct versions succeeds
            const result1 = await storage.save(saved1).run();
            const result2 = await storage.save(saved2).run();

            expect(result1.isOk()).toBe(true);
            expect(result2.isOk()).toBe(true);
        });
    });
});
