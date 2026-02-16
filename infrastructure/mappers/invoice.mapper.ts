import { CalendarDate } from '../../core/invoices/domain/calendar-date/calendar-date';
import { Id } from '../../core/invoices/domain/id/id';
import { Invoice } from '../../core/invoices/domain/invoice/invoice';
import { Issuer } from '../../core/invoices/domain/issuer/issuer';
import { LineItem } from '../../core/invoices/domain/line-item/line-item';
import { LineItems } from '../../core/invoices/domain/line-items/line-items';
import { Paypal } from '../../core/invoices/domain/recipient/billing/paypal';
import { Wire } from '../../core/invoices/domain/recipient/billing/wire';
import { Recipient } from '../../core/invoices/domain/recipient/recipient';
import { VatRate } from '../../core/invoices/domain/vat-rate/vat-rate';
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
        const items = plain.lineItems.items.map((item) =>
            LineItem.create({
                description: item.description,
                price: item.price,
                quantity: item.quantity,
            }).unwrap()
        );
        const lineItems = LineItems.create({ items }).unwrap();
        const vatRate = plain.vatRate
            ? VatRate.create(plain.vatRate).unwrap()
            : null;
        const issueDate = CalendarDate.create(plain.issueDate).unwrap();
        const dueDate = CalendarDate.create(plain.dueDate).unwrap();
        const issuer = Issuer.create(plain.issuer).unwrap();
        const billing =
            plain.recipient.billing.type === 'PAYPAL'
                ? Paypal.create({
                      email: plain.recipient.billing.data.email,
                  }).unwrap()
                : Wire.create(plain.recipient.billing.data).unwrap();
        const recipient = Recipient.create({
            ...plain.recipient,
            billing,
        }).unwrap();

        return Invoice.create({
            id: Id.fromString(plain.id),
            lineItems,
            issueDate,
            dueDate,
            issuer,
            vatRate,
            recipient,
        }).unwrap();
    }
}

new InvoiceMapper();
