import { Session } from '../../../../../shared/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../infrastructure/event-outbox/event-outbox.ts';
import { getTestKysely } from '../../../../../../test/kysely.ts';
const kysely = getTestKysely();
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice.ts';
import { ArchiveDraftInvoice } from './archive-draft-invoice.ts';
import { DraftInvoiceArchivedEvent } from '../../../domain/draft-invoice/events/draft-invoice-archived.event.ts';
import { KNOWN_ERROR_CODE } from '../../../../../shared/errors/known-error-codes.ts';

describe('ArchiveDraftInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let archiveCommand: ArchiveDraftInvoice;

    beforeEach(() => {
        domainEventsBus = new InMemoryDomainEventsBus();
        session = new Session(
            new PersistentManager(
                kysely,
                domainEventsBus,
                EventOutboxStorage.create(kysely)
            )
        );
        createCommand = new CreateDraftInvoice(session);
        archiveCommand = new ArchiveDraftInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when draft invoice does not exist', async () => {
        await expect(
            archiveCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
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
