import { DomainEvent } from '../../../../../shared/events/domain-event.ts';
import { DraftInvoiceEventData } from './draft-invoice-event.data.ts';

export class DraftInvoiceDraftedEvent extends DomainEvent<DraftInvoiceEventData> {}
