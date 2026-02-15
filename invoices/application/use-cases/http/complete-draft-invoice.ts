import { DomainEventsBus } from '../../../../building-blocks/domain-events-bus';
import { APPLICATION_ERROR_CODE } from '../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../building-blocks/errors/application/application.error';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice';
import { Invoice } from '../../../domain/invoice/invoice';
import { UnitOfWorkFactory } from '../../unit-of-work/unit-of-work.interface';

export class CompleteDraftInvoice {
    constructor(
        private readonly unitOfWorkFactory: UnitOfWorkFactory,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    public execute(id: string) {
        using unitOfWork = this.unitOfWorkFactory.create();

        const draftInvoice = unitOfWork.collection(DraftInvoice).get(id);

        if (!draftInvoice) {
            throw new ApplicationError({
                message: 'Draft invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        const invoice = draftInvoice.toInvoice().unwrap();

        unitOfWork.collection(Invoice).add(invoice.id.toString(), invoice);

        this.domainEventsBus.publishEvents(draftInvoice, invoice);

        return invoice.toPlain();
    }
}
