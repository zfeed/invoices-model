import { CalendarDate } from '../../core/invoices/domain/calendar-date/calendar-date';
import { DraftInvoice } from '../../core/invoices/domain/draft-invoice/draft-invoice';
import { Id } from '../../core/invoices/domain/id/id';
import { Issuer } from '../../core/invoices/domain/issuer/issuer';
import { LineItem } from '../../core/invoices/domain/line-item/line-item';
import { LineItems } from '../../core/invoices/domain/line-items/line-items';
import { Paypal } from '../../core/invoices/domain/recipient/billing/paypal';
import { Wire } from '../../core/invoices/domain/recipient/billing/wire';
import { Recipient } from '../../core/invoices/domain/recipient/recipient';
import { DraftInvoiceStatus } from '../../core/invoices/domain/status/status';
import { VatRate } from '../../core/invoices/domain/vat-rate/vat-rate';
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
        const status = DraftInvoiceStatus.fromString(plain.status).unwrap();

        const lineItems = plain.lineItems
            ? LineItems.create({
                  items: plain.lineItems.items.map((item) =>
                      LineItem.create({
                          description: item.description,
                          price: item.price,
                          quantity: item.quantity,
                      }).unwrap()
                  ),
              }).unwrap()
            : null;

        const vatRate = plain.vatRate
            ? VatRate.create(plain.vatRate).unwrap()
            : null;

        const issuer = plain.issuer
            ? Issuer.create(plain.issuer).unwrap()
            : null;

        const recipient = plain.recipient
            ? (() => {
                  const billing =
                      plain.recipient.billing.type === 'PAYPAL'
                          ? Paypal.create({
                                email: plain.recipient.billing.data.email,
                            }).unwrap()
                          : Wire.create(plain.recipient.billing.data).unwrap();
                  return Recipient.create({
                      ...plain.recipient,
                      billing,
                  }).unwrap();
              })()
            : null;

        const issueDate = plain.issueDate
            ? CalendarDate.create(plain.issueDate).unwrap()
            : null;

        const dueDate = plain.dueDate
            ? CalendarDate.create(plain.dueDate).unwrap()
            : null;

        const total = lineItems
            ? vatRate
                ? vatRate.applyTo(lineItems.subtotal)
                : lineItems.subtotal
            : null;

        const vatAmount =
            lineItems && vatRate && total
                ? total.subtract(lineItems.subtotal).unwrap()
                : null;

        return DraftInvoice.reconstruct({
            id: Id.fromString(plain.id),
            status,
            lineItems,
            total,
            vatRate,
            vatAmount,
            issueDate,
            dueDate,
            issuer,
            recipient,
        });
    }
}

new DraftInvoiceMapper();
