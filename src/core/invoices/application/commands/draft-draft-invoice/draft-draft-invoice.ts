import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../../building-blocks/errors/application/application.error';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Id } from '../../../domain/id/id';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { UnitOfWorkFactory } from '../../../../shared/unit-of-work/unit-of-work.interface';

export class DraftDraftInvoice {
    constructor(
        private readonly unitOfWorkFactory: UnitOfWorkFactory,
        private readonly domainEvents: DomainEvents
    ) {}

    public async execute(id: string) {
        const draftInvoice = await this.unitOfWorkFactory.start(
            async (unitOfWork) => {
                const draftInvoice = await unitOfWork
                    .collection(DraftInvoice)
                    .get(Id.fromString(id));

                if (!draftInvoice) {
                    throw new ApplicationError({
                        message: 'Draft invoice not found',
                        code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
                    });
                }

                draftInvoice.draft().unwrap();

                return draftInvoice;
            }
        );

        await this.domainEvents.publishEvents(draftInvoice);

        return draftInvoice.toPlain();
    }
}
