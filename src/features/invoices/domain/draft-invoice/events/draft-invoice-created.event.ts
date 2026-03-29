import { DomainEvent } from '../../../../../shared/events/domain-event';
import { DraftInvoiceEventData } from './draft-invoice-event.data';

export class DraftInvoiceCreatedEvent extends DomainEvent<DraftInvoiceEventData> {}
