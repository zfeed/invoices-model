import { Amount } from './amount';
import { Currency } from './currency';
import { Invoice } from './invoice';
import { VatRate } from './vat-rate';

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
    const vatRate = VatRate.fromPercent('20');

    invoice.applyVatRate(vatRate);

    expect(invoice.total.amount.equals(Amount.fromString('120'))).toBe(true);
    expect(invoice.vatRate.equals(VatRate.fromPercent('20'))).toBe(true);
});
