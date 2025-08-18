import { Money } from '../money/money';
import { Invoice } from './invoice';
import { Vat } from '../vat/vat';

describe('Invoice', () => {
    it('should create an Invoice instance with 0% VAT', () => {
        const invoice = Invoice.create('100', 'USD');

        expect(invoice.total.equals(Money.fromString('100', 'USD'))).toBe(true);
        expect(invoice.vat.equals(Vat.fromPercent('0'))).toBe(true);
    });
});

it('Should apply VAT to invoice total', () => {
    const invoice = Invoice.create('100', 'USD');
    const vat = Vat.fromPercent('20');

    invoice.applyVat(vat);

    expect(invoice.total.equals(Money.fromString('120', 'USD'))).toBe(true);
    expect(invoice.vat.equals(Vat.fromPercent('20'))).toBe(true);
});
