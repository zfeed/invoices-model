import { InMemoryUnitOfWorkFactory } from '../../../../../../infrastructure/unit-of-work/in-memory.unit-of-work';
import { InMemoryDomainEvents } from '../../../../../../infrastructure/domain-events/in-memory-domain-events';
import { CreateDraftInvoice } from '../create-draft-invoice/create-draft-invoice';
import { ArchiveDraftInvoice } from '../archive-draft-invoice/archive-draft-invoice';
import { DraftDraftInvoice } from './draft-draft-invoice';
import { DraftInvoiceDraftedEvent } from '../../../../domain/draft-invoice/events/draft-invoice-drafted.event';
import { APPLICATION_ERROR_CODE } from '../../../../../../building-blocks/errors/application/application-codes';

describe('DraftDraftInvoice', () => {
    let unitOfWorkFactory: InMemoryUnitOfWorkFactory;
    let domainEvents: InMemoryDomainEvents;
    let createCommand: CreateDraftInvoice;
    let archiveCommand: ArchiveDraftInvoice;
    let draftCommand: DraftDraftInvoice;

    beforeEach(() => {
        unitOfWorkFactory = new InMemoryUnitOfWorkFactory();
        domainEvents = new InMemoryDomainEvents();
        createCommand = new CreateDraftInvoice(unitOfWorkFactory, domainEvents);
        archiveCommand = new ArchiveDraftInvoice(unitOfWorkFactory, domainEvents);
        draftCommand = new DraftDraftInvoice(unitOfWorkFactory, domainEvents);
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
        await domainEvents.subscribeToEvent(
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
