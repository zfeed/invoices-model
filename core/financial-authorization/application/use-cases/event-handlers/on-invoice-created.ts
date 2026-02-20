import { IO } from '../../../../../building-blocks/io';
import { Some } from '../../../../../building-blocks/some';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { InvoiceCreatedEvent } from '../../../../invoices/domain/invoice/events/invoice-created.event';
import {
    createDocument,
    FinancialDocument,
} from '../../../domain/document/document';
import { Money, createMoney } from '../../../domain/money/money';
import { createReferenceId } from '../../../domain/reference-id/reference-id';
import { selectAuthflow } from '../../../domain/authflow/authflow-policy';
import { DocumentStorage } from '../../storage/document-storage.interface';
import { PolicyStorage } from '../../storage/policy-storage.interface';

const extractReferenceId = (data: { id: string }) => createReferenceId(data.id);

const extractValue = (data: {
    total: { amount: string; currency: string };
}): Money => createMoney(data.total.amount, data.total.currency).unwrap();

const createNewDocument =
    (policyStorage: PolicyStorage) =>
    (referenceId: string, value: Money): IO<FinancialDocument> =>
        policyStorage.findByAction('approve').map((found) => {
            const authflows = found.fold(
                () => [],
                (policy) => {
                    const result = selectAuthflow(policy, value);
                    return result.isOk() ? [result.unwrap()] : [];
                }
            );
            return createDocument({ referenceId, value, authflows }).unwrap();
        });

const saveNewDocument =
    (storage: DocumentStorage, policyStorage: PolicyStorage) =>
    (referenceId: string, value: Money): IO<FinancialDocument> =>
        createNewDocument(policyStorage)(referenceId, value).flatMap((doc) =>
            storage.save(doc).map((result) => result.unwrap())
        );

const orElseCreate =
    (storage: DocumentStorage, policyStorage: PolicyStorage) =>
    (referenceId: string, value: Money) =>
    (found: Some<FinancialDocument>): IO<FinancialDocument> =>
        found.fold(
            () => saveNewDocument(storage, policyStorage)(referenceId, value),
            IO.of
        );

const handleEvent =
    (storage: DocumentStorage, policyStorage: PolicyStorage) =>
    async (event: InvoiceCreatedEvent): Promise<void> => {
        const referenceId = extractReferenceId(event.data);
        const value = extractValue(event.data);

        await storage
            .findByReferenceId(referenceId)
            .flatMap(orElseCreate(storage, policyStorage)(referenceId, value))
            .run();
    };

export const onInvoiceCreated = async (
    domainEvents: DomainEvents,
    storage: DocumentStorage,
    policyStorage: PolicyStorage
) => {
    await domainEvents.subscribeToEvent(
        InvoiceCreatedEvent,
        handleEvent(storage, policyStorage)
    );
};
