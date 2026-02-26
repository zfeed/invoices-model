import { Session } from '../../../../../infrastructure/unit-of-work/session';
import { Storage } from '../../../../../infrastructure/unit-of-work/storage/storage';
import { InMemoryDomainEvents } from '../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { ArchiveDraftInvoice } from './archive-draft-invoice';
import { DraftInvoiceArchivedEvent } from '../../../domain/draft-invoice/events/draft-invoice-archived.event';
import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';

describe('ArchiveDraftInvoice', () => {
    let session: Session;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let archiveCommand: ArchiveDraftInvoice;

    beforeEach(() => {
        session = new Session({ storage: new Storage(), maxRetries: 5 });
        domainEvents = new InMemoryDomainEvents();
        createCommand = new CreateDraftInvoice(session, domainEvents);
        archiveCommand = new ArchiveDraftInvoice(session, domainEvents);
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
        await domainEvents.subscribeToEvent(
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
