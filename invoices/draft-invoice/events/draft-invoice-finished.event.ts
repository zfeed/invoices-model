import { DomainEvent } from '../../../building-blocks/events/domain-event';
import { DraftInvoiceEventData } from './draft-invoice-event.data';

export class DraftInvoiceFinishedEvent extends DomainEvent<DraftInvoiceEventData> {
    constructor(data: DraftInvoiceEventData) {
        super({ name: 'draft-invoice.finished', data });
    }
}
