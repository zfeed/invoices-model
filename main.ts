import { strictEqual } from 'assert/strict';

import { Amount } from './invoices/amount';
import { Currency } from './invoices/currency';
import { Invoice } from './invoices/invoice';
import { VatRate } from './invoices/vat-rate';

function main() {
    const invoice = Invoice.create('100', 'USD');

    strictEqual(invoice.total.amount.equals(Amount.fromString('100')), true); // Amount should match
    strictEqual(
        invoice.total.currency.equals(Currency.fromISO4217('USD')),
        true
    ); // Currency should match
    strictEqual(invoice.vatRate.equals(VatRate.fromPercent('0')), true); // Default VAT rate is 0%

    const vatRateInUSA = VatRate.fromPercent('20');
    invoice.applyVatRate(vatRateInUSA);

    strictEqual(invoice.total.amount.equals(Amount.fromString('120')), true);
    strictEqual(
        invoice.total.currency.equals(Currency.fromISO4217('USD')),
        true
    ); // Currency should match
    strictEqual(invoice.vatRate.equals(VatRate.fromPercent('20')), true); // VAT rate should match
}

main();
