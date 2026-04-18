import { DomainEvent } from '../../../../bulding-blocks/events/domain-event.ts';
import { DraftInvoiceEventData } from './draft-invoice-event.data.ts';

export class DraftInvoiceCreatedEvent extends DomainEvent<DraftInvoiceEventData> {}
