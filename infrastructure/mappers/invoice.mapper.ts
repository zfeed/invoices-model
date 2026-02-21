import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { Mapper } from './mapper';

type InvoicePlain = ReturnType<Invoice['toPlain']>;

class InvoiceMapper extends Mapper<Invoice, InvoicePlain> {
    entityClass() {
        return Invoice;
    }

    toPlain(invoice: Invoice): InvoicePlain {
        return invoice.toPlain();
    }

    toDomain(plain: InvoicePlain): Invoice {
        return Invoice.fromPlain(plain);
    }
}

new InvoiceMapper();
