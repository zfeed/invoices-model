import { randomUUID } from 'crypto';
import { DomainEventsBus } from '../../../../building-blocks/domain-events-bus';
import { APPLICATION_ERROR_CODE } from '../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../building-blocks/errors/application/application.error';
import { DraftInvoiceCollection } from '../../collections/draft-invoice.collection';
import { InvoiceCollection } from '../../collections/invoice.collection';

export class UpdateDraftInvoice {
    constructor(
        private readonly draftInvoiceCollection: DraftInvoiceCollection,
        private readonly invoiceCollection: InvoiceCollection,
        private readonly domainEventsBus: DomainEventsBus
    ) {}

    public execute(id: string) {
        const draftInvoice = this.draftInvoiceCollection.get(id);

        if (!draftInvoice) {
            throw new ApplicationError({
                message: 'Draft invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        const invoice = draftInvoice.toInvoice().unwrap();

        this.invoiceCollection.add(randomUUID(), invoice);

        this.domainEventsBus.publishEvents(draftInvoice, invoice);

        return invoice.toPlain();
    }
}
