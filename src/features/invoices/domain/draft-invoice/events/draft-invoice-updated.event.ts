import { DomainEvent } from '../../../../../shared/events/domain-event';
import { DraftInvoiceEventData } from './draft-invoice-event.data';

export class DraftInvoiceUpdatedEvent extends DomainEvent<DraftInvoiceEventData> {
    constructor(data: DraftInvoiceEventData) {
        super(data);
    }
}
