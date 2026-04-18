import { DomainEvent } from '../../../../building-blocks/events/domain-event.ts';
import { DraftInvoiceEventData } from './draft-invoice-event.data.ts';

export class DraftInvoiceCreatedEvent extends DomainEvent<DraftInvoiceEventData> {}
