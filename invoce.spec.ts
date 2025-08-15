import { Amount } from './invoices/amount';
import { Currency } from './invoices/currency';
import { Invoice } from './invoices/invoice';
import { VatRate } from './invoices/vat-rate';

describe('Invoice', () => {
    it('should create an Invoice instance with 0% VAT', () => {
        const invoice = Invoice.create('100', 'USD');

        expect(invoice.total.amount.equals(Amount.fromString('100'))).toBe(true);
        expect(invoice.total.currency.equals(Currency.fromISO4217('USD'))).toBe(true); 
        expect(invoice.vatRate.equals(VatRate.fromPercent('0'))).toBe(true); 
    });
});

it('Should apply VAT rate to invoice total', () => {
    const invoice = Invoice.create('100', 'USD');
    invoice.vatRate = VatRate.fromPercent('20');

    expect(invoice.total.amount.equals(Amount.fromString('120'))).toBe(true); 
    expect(invoice.vatRate.equals(VatRate.fromPercent('20'))).toBe(true); 
});
