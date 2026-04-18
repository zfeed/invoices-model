import { DomainEvent } from '../../../../bulding-blocks/events/domain-event.ts';
import { DraftInvoiceEventData } from './draft-invoice-event.data.ts';

export class DraftInvoiceArchivedEvent extends DomainEvent<DraftInvoiceEventData> {}
