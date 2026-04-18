import { Session } from '../../../../building-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../../../../platform/infrastructure/persistent-manager/pg-persistent-manager.ts';
import { InMemoryDomainEventsBus } from '../../../../../platform/infrastructure/domain-events/in-memory-domain-events-bus.ts';
import { EventOutboxStorage } from '../../../../../platform/infrastructure/event-outbox/event-outbox.ts';
import { getTestKysely } from '../../../../../../test/kysely.ts';
const kysely = getTestKysely();
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice.ts';
import { ArchiveDraftInvoice } from '../archive-draft-invoice/archive-draft-invoice.ts';
import { DraftDraftInvoice } from './draft-draft-invoice.ts';
import { DraftInvoiceDraftedEvent } from '../../../domain/draft-invoice/events/draft-invoice-drafted.event.ts';
import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';

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
            code: KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
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
