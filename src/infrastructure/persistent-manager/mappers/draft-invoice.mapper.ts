import { DraftInvoice } from '../../../core/invoices/domain/draft-invoice/draft-invoice';
import { Mapper } from './mapper';

type DraftInvoicePlain = ReturnType<DraftInvoice['toPlain']>;

class DraftInvoiceMapper extends Mapper<DraftInvoice, DraftInvoicePlain> {
    entityClass() {
        return DraftInvoice;
    }

    toPlain(draftInvoice: DraftInvoice): DraftInvoicePlain {
        return draftInvoice.toPlain();
    }

    toDomain(plain: DraftInvoicePlain): DraftInvoice {
        return DraftInvoice.fromPlain(plain);
    }
}

new DraftInvoiceMapper();
