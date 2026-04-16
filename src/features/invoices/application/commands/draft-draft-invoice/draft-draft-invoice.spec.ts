import { Session } from '../../../../../shared/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../infrastructure/event-outbox/event-outbox.ts';
import { kysely } from '../../../../../../database/kysely.ts';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice.ts';
import { ArchiveDraftInvoice } from '../archive-draft-invoice/archive-draft-invoice.ts';
import { DraftDraftInvoice } from './draft-draft-invoice.ts';
import { DraftInvoiceDraftedEvent } from '../../../domain/draft-invoice/events/draft-invoice-drafted.event.ts';
import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes.ts';

describe('DraftDraftInvoice', () => {
    let session: Session;
    let domainEventsBus: InMemoryDomainEventsBus;
    let createCommand: CreateDraftInvoice;
    let archiveCommand: ArchiveDraftInvoice;
    let draftCommand: DraftDraftInvoice;

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
        draftCommand = new DraftDraftInvoice(session);
    });

    it('should throw ITEM_NOT_FOUND when draft invoice does not exist', async () => {
        await expect(
            draftCommand.execute('non-existing-id')
        ).rejects.toMatchObject({
            code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
        });
    });

    it('should move an archived draft invoice back to draft', async () => {
        const draft = await createCommand.execute({});
        await archiveCommand.execute(draft.id);

        const result = await draftCommand.execute(draft.id);

        expect(result.status).toBe('DRAFT');
    });

    it('should publish DraftInvoiceDraftedEvent', async () => {
        const draftedEvents: DraftInvoiceDraftedEvent[] = [];
        await domainEventsBus.subscribeToEvent(
            DraftInvoiceDraftedEvent,
            async (e) => {
                draftedEvents.push(e);
            }
        );

        const draft = await createCommand.execute({});
        await archiveCommand.execute(draft.id);
        await draftCommand.execute(draft.id);

        expect(draftedEvents).toEqual([
            expect.objectContaining({
                name: 'draft-invoice.drafted',
                data: expect.objectContaining({
                    id: draft.id,
                    status: 'DRAFT',
                }),
            }),
        ]);
    });
});
