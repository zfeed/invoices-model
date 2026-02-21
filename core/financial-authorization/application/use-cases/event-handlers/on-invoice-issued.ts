import { IO } from '../../../../../building-blocks/io';
import { Some } from '../../../../../building-blocks/some';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { InvoiceIssuedEvent } from '../../../../invoices/domain/invoice/events/invoice-issued.event';
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
    (policyStorage: PolicyStorage) => (referenceId: string, value: Money) =>
        policyStorage.findByAction('pay').map((found) => {
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
    (referenceId: string, value: Money) =>
        createNewDocument(policyStorage)(referenceId, value).flatMap((doc) =>
            storage.save(doc).map(() => doc)
        );

const orElseCreate =
    (storage: DocumentStorage, policyStorage: PolicyStorage) =>
    (referenceId: string, value: Money) =>
    (found: Some<FinancialDocument>) =>
        found.fold(
            () =>
                saveNewDocument(storage, policyStorage)(referenceId, value).map(
                    Some.of
                ),
            () => IO.of(Some.none())
        );

const handleEvent =
    (
        domainEvents: DomainEvents,
        storage: DocumentStorage,
        policyStorage: PolicyStorage
    ) =>
    async (event: InvoiceIssuedEvent): Promise<void> => {
        const referenceId = extractReferenceId(event.data);
        const value = extractValue(event.data);

        const result = await storage
            .findByReferenceId(referenceId)
            .flatMap(orElseCreate(storage, policyStorage)(referenceId, value))
            .run();

        await result.fold(
            () => Promise.resolve(),
            (doc) => domainEvents.publishEvents(doc)
        );
    };

export const onInvoiceIssued = async (
    domainEvents: DomainEvents,
    storage: DocumentStorage,
    policyStorage: PolicyStorage
) => {
    await domainEvents.subscribeToEvent(
        InvoiceIssuedEvent,
        handleEvent(domainEvents, storage, policyStorage)
    );
};
