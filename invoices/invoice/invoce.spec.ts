import { Money } from '../money/money/money';
import { Invoice } from './invoice';
import { Vat } from '../vat/vat';
import { LineItem } from '../line-item/line-item';
import { CalendarDate } from '../calendar-date/calendar-date';
import { Recipient, RECIPIENT_TYPE } from '../recipient/recipient';
import { Paypal } from '../recipient/billing/paypal';
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { LineItems } from '../line-items/line-items';

describe('Invoice', () => {
    it('should create an invoice instance', () => {
        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();
        const lineItem2 = LineItem.create({
            description: 'Item 2',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '1',
        }).unwrap();
        const issueDate = CalendarDate.create('2023-01-01').unwrap();
        const dueDate = CalendarDate.create('2028-01-01').unwrap();
        const issuer = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: 'Company Inc.',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        }).unwrap();

        const recipientBilling = Paypal.create({
            email: 'customer@example.com',
        }).unwrap();
        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'Jane Smith',
            address: '456 Another St, City, Country',
            taxId: 'TAX654321',
            email: 'jane.smith@example.com',
            taxResidenceCountry: 'US',
            billing: recipientBilling,
        }).unwrap();
        const lineItems = LineItems.create({
            items: [lineItem1, lineItem2],
        }).unwrap();

        const vatRate = Vat.create('10').unwrap();
        const vatAmount = Money.create('20', 'USD').unwrap();

        const invoice = Invoice.create({
            issueDate: issueDate,
            dueDate: dueDate,
            lineItems: lineItems,
            vatRate: vatRate,
            issuer: issuer,
            recipient: recipient,
        }).unwrap();

        expect(invoice.total.equals(Money.create('220', 'USD').unwrap())).toBe(
            true
        );
        expect(
            invoice.lineItems.subtotal.equals(
                Money.create('200', 'USD').unwrap()
            )
        ).toBe(true);
        expect(invoice.vatRate.equals(Vat.create('10').unwrap())).toBe(true);
        expect(
            invoice.vatAmount.equals(Money.create('20', 'USD').unwrap())
        ).toBe(true);
        expect(invoice.lineItems).toHaveLength(2);
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem1))
        ).toBeDefined();
        expect(
            invoice.lineItems.find((lineItem) => lineItem.equals(lineItem2))
        ).toBeDefined();
        expect(invoice.issueDate.equals(issueDate)).toBe(true);
        expect(invoice.dueDate.equals(dueDate)).toBe(true);
        expect(invoice.issuer.equals(issuer)).toBe(true);
        expect(invoice.recipient.type).toBe('INDIVIDUAL');
        expect(invoice.vatRate.equals(vatRate)).toBe(true);
        expect(invoice.vatAmount.equals(vatAmount)).toBe(true);
    });
});
