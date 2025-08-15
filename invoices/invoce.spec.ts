import { Money } from './money';
import { Invoice } from './invoice';
import { VatRate } from './vat-rate';

describe('Invoice', () => {
    it('should create an Invoice instance with 0% VAT', () => {
        const invoice = Invoice.create('100', 'USD');

        expect(invoice.total.equals(Money.fromString('100', 'USD'))).toBe(true);
        expect(invoice.vatRate.value.equals(VatRate.fromPercent('0').value)).toBe(true);
    });
});

it('Should apply VAT rate to invoice total', () => {
    const invoice = Invoice.create('100', 'USD');
    const vatRate = VatRate.fromPercent('20');

    invoice.applyVatRate(vatRate);

    expect(invoice.total.equals(Money.fromString('120', 'USD'))).toBe(true);
    expect(invoice.vatRate.equals(VatRate.fromPercent('20'))).toBe(true);
});
