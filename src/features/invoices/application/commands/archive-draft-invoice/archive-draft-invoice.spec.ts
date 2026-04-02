import { Session } from '../../../../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../../../../infrastructure/persistent-manager/pg-persistent-manager';
import { InMemoryDomainEventsBus } from '../../../../../infrastructure/domain-events/in-memory-domain-events-bus';
import { EventOutboxStorage } from '../../../../../infrastructure/event-outbox/event-outbox';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { ArchiveDraftInvoice } from './archive-draft-invoice';
import { DraftInvoiceArchivedEvent } from '../../../domain/draft-invoice/events/draft-invoice-archived.event';
import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes';

describe('ArchiveDraftInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let archiveCommand: ArchiveDraftInvoice;

    beforeEach(() => {
        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                domainEventsBus,
                EventOutboxStorage.create()
            )
        );
        createCommand = new CreateDraftInvoice(session);
        archiveCommand = new ArchiveDraftInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when draft invoice does not exist', async () => {
        await expect(
            archiveCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should archive a draft invoice', async () => {
        const draft = await createCommand.execute({});

        const result = await archiveCommand.execute(draft.id);

        expect(result.status).toBe('ARCHIVED');
    });

    it('should publish DraftInvoiceArchivedEvent', async () => {
        const archivedEvents: DraftInvoiceArchivedEvent[] = [];
        await domainEventsBus.subscribeToEvent(
            DraftInvoiceArchivedEvent,
            async (e) => {
                archivedEvents.push(e);
            }
        );

        const draft = await createCommand.execute({});
        await archiveCommand.execute(draft.id);

        expect(archivedEvents).toEqual([
            expect.objectContaining({
                name: 'draft-invoice.archived',
                data: expect.objectContaining({
                    id: draft.id,
                    status: 'ARCHIVED',
                }),
            }),
        ]);
    });
});
