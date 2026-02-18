import { IO } from '../../../../../building-blocks/io';
import { Some } from '../../../../../building-blocks/some';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { InvoiceCreatedEvent } from '../../../../invoices/domain/invoice/events/invoice-created.event';
import {
    createDocument,
    FinancialDocument,
} from '../../../domain/document/document';
import { createReferenceId } from '../../../domain/reference-id/reference-id';
import { DocumentStorage } from '../../storage/io';

const extractReferenceId = (data: { id: string }) => createReferenceId(data.id);

const createNewDocument = (referenceId: string): FinancialDocument =>
    createDocument({ referenceId, authflows: [] }).unwrap();

const saveIfMissing =
    (storage: DocumentStorage) =>
    (referenceId: string) =>
    (found: Some<FinancialDocument>): IO<FinancialDocument> =>
        found.fold(
            () =>
                storage
                    .save(createNewDocument(referenceId))
                    .map((result) => result.unwrap()),
            (existing) => IO.of(existing)
        );

const handleEvent =
    (storage: DocumentStorage) =>
    async (event: InvoiceCreatedEvent): Promise<void> => {
        const referenceId = extractReferenceId(event.data);

        await storage
            .findByReferenceId(referenceId)
            .flatMap(saveIfMissing(storage)(referenceId))
            .run();
    };

export const onInvoiceCreated = (
    domainEvents: DomainEvents,
    storage: DocumentStorage
) => {
    domainEvents.subscribeToEvent(InvoiceCreatedEvent, handleEvent(storage));
};
