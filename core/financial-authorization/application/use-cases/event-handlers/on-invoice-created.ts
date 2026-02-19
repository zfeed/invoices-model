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
import { DocumentStorage } from '../../storage/document-storage.interface';

const extractReferenceId = (data: { id: string }) => createReferenceId(data.id);

const extractValue = (data: {
    total: { amount: string; currency: string };
}): Money => createMoney(data.total.amount, data.total.currency).unwrap();

const createNewDocument = (
    referenceId: string,
    value: Money
): FinancialDocument =>
    createDocument({ referenceId, value, authflows: [] }).unwrap();

const saveNewDocument =
    (storage: DocumentStorage) =>
    (referenceId: string, value: Money): IO<FinancialDocument> =>
        storage
            .save(createNewDocument(referenceId, value))
            .map((result) => result.unwrap());

const orElseCreate =
    (storage: DocumentStorage) =>
    (referenceId: string, value: Money) =>
    (found: Some<FinancialDocument>): IO<FinancialDocument> =>
        found.fold(() => saveNewDocument(storage)(referenceId, value), IO.of);

const handleEvent =
    (storage: DocumentStorage) =>
    async (event: InvoiceCreatedEvent): Promise<void> => {
        const referenceId = extractReferenceId(event.data);
        const value = extractValue(event.data);

        await storage
            .findByReferenceId(referenceId)
            .flatMap(orElseCreate(storage)(referenceId, value))
            .run();
    };

export const onInvoiceCreated = async (
    domainEvents: DomainEvents,
    storage: DocumentStorage
) => {
    await domainEvents.subscribeToEvent(
        InvoiceCreatedEvent,
        handleEvent(storage)
    );
};
