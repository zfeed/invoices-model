import type { Kysely } from 'kysely';
import { DB, DraftInvoiceStatus } from 'kysely-codegen';
import { DraftInvoice } from '../../src/core/invoices/domain/draft-invoice/draft-invoice.ts';
import { Id } from '../../src/core/invoices/domain/id/id.ts';
import { LineItem } from '../../src/core/invoices/domain/line-item/line-item.ts';
import { VatRate } from '../../src/core/invoices/domain/vat-rate/vat-rate.ts';
import { CalendarDate } from '../../src/core/invoices/domain/calendar-date/calendar-date.ts';
import {
    Issuer,
    ISSUER_TYPE,
} from '../../src/core/invoices/domain/issuer/issuer.ts';
import {
    Recipient,
    RECIPIENT_TYPE,
} from '../../src/core/invoices/domain/recipient/recipient.ts';
import { Paypal } from '../../src/core/invoices/domain/billing/paypal/paypal.ts';

export async function seed(db: Kysely<DB>): Promise<void> {
    const id = Id.create().unwrap();
    const draftInvoice = DraftInvoice.create(id).unwrap();

    const lineItem1 = LineItem.create({
        description: 'Web Development Services',
        price: { amount: '15000', currency: 'EUR' },
        quantity: '1',
    }).unwrap();

    const lineItem2 = LineItem.create({
        description: 'UI/UX Design',
        price: { amount: '8000', currency: 'EUR' },
        quantity: '2',
    }).unwrap();

    const lineItem3 = LineItem.create({
        description: 'Cloud Hosting (Monthly)',
        price: { amount: '2500', currency: 'EUR' },
        quantity: '3',
    }).unwrap();

    draftInvoice.addLineItem(lineItem1);
    draftInvoice.addLineItem(lineItem2);
    draftInvoice.addLineItem(lineItem3);

    const vatRate = VatRate.create('19').unwrap();
    draftInvoice.applyVat(vatRate);

    const issueDate = CalendarDate.create('2026-02-28').unwrap();
    const dueDate = CalendarDate.create('2026-03-30').unwrap();
    draftInvoice.addIssueDate(issueDate);
    draftInvoice.addDueDate(dueDate);

    const issuer = Issuer.create({
        type: ISSUER_TYPE.COMPANY,
        name: 'Acme Software GmbH',
        address: 'Friedrichstraße 123, 10117 Berlin, Germany',
        taxId: 'DE123456789',
        email: 'billing@acme-software.de',
    }).unwrap();
    draftInvoice.addIssuer(issuer);

    const billing = Paypal.create({
        email: 'payments@clientcorp.com',
    }).unwrap();

    const recipient = Recipient.create({
        type: RECIPIENT_TYPE.COMPANY,
        name: 'ClientCorp Ltd',
        address: '10 Downing Street, London SW1A 2AA, United Kingdom',
        taxId: 'GB987654321',
        email: 'invoices@clientcorp.com',
        taxResidenceCountry: 'GB',
        billing,
    }).unwrap();
    draftInvoice.addRecipient(recipient);

    const plain = draftInvoice.toPlain();
    const now = new Date();

    await db.transaction().execute(async (trx) => {
        await trx
            .insertInto('draft_invoices')
            .values({
                id: plain.id,
                status: plain.status as DraftInvoiceStatus,
                vat_rate: plain.vatRate,
                vat_amount: plain.vatAmount?.amount ?? null,
                vat_currency: plain.vatAmount?.currency ?? null,
                subtotal_amount: plain.lineItems?.subtotal?.amount ?? null,
                subtotal_currency: plain.lineItems?.subtotal?.currency ?? null,
                total_amount: plain.total?.amount ?? null,
                total_currency: plain.total?.currency ?? null,
                issue_date: plain.issueDate,
                due_date: plain.dueDate,
                issuer_type: plain.issuer?.type ?? null,
                issuer_name: plain.issuer?.name ?? null,
                issuer_address: plain.issuer?.address ?? null,
                issuer_tax_id: plain.issuer?.taxId ?? null,
                issuer_email: plain.issuer?.email ?? null,
                recipient_type: plain.recipient?.type ?? null,
                recipient_name: plain.recipient?.name ?? null,
                recipient_address: plain.recipient?.address ?? null,
                recipient_tax_id: plain.recipient?.taxId ?? null,
                recipient_email: plain.recipient?.email ?? null,
                recipient_tax_residence_country:
                    plain.recipient?.taxResidenceCountry ?? null,
                created_at: now,
                updated_at: now,
            })
            .execute();

        const lineItemsPlain = plain.lineItems!.items;

        await trx
            .insertInto('draft_invoice_line_items')
            .values(
                lineItemsPlain.map((item) => ({
                    draft_invoice_id: plain.id,
                    description: item.description,
                    price_amount: item.price.amount,
                    price_currency: item.price.currency,
                    quantity: item.quantity,
                    total_amount: item.total.amount,
                    total_currency: item.total.currency,
                }))
            )
            .execute();

        await trx
            .insertInto('draft_invoice_paypal_billings')
            .values({
                draft_invoice_id: plain.id,
                email: plain.recipient!.billing.data.email,
            })
            .execute();
    });
}
