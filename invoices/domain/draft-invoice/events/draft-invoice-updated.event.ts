import { DomainEvent } from '../../../../building-blocks/events/domain-event';
import { DraftInvoiceEventData } from './draft-invoice-event.data';

export class DraftInvoiceUpdatedEvent extends DomainEvent<DraftInvoiceEventData> {
    constructor(data: DraftInvoiceEventData) {
        super({ name: 'draft-invoice.updated', data });
    }
}
