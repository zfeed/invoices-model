import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../../building-blocks/errors/application/application.error';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Id } from '../../../domain/id/id';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { Session } from '../../../../shared/unit-of-work/unit-of-work.interface';

export class DraftDraftInvoice {
    constructor(
        private readonly session: Session,
        private readonly domainEvents: DomainEvents
    ) {}

    public async execute(id: string) {
        await using unitOfWork = await this.session.begin();

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

        await this.domainEvents.publishEvents(draftInvoice);

        return draftInvoice.toPlain();
    }
}
