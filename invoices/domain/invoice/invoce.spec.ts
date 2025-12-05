import { CalendarDate } from '../calendar-date/calendar-date';
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { LineItem } from '../line-item/line-item';
import { LineItems } from '../line-items/line-items';
import { Money } from '../money/money/money';
import { Paypal } from '../recipient/billing/paypal';
import { Recipient, RECIPIENT_TYPE } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';
import { Invoice } from './invoice';

describe('Invoice', () => {
    it('should create an invoice', () => {
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

        const vatRate = VatRate.create('10').unwrap();
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
        expect(invoice.vatRate!.equals(VatRate.create('10').unwrap())).toBe(
            true
        );
        expect(
            invoice.vatAmount!.equals(Money.create('20', 'USD').unwrap())
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
        expect(invoice.vatRate!.equals(vatRate)).toBe(true);
        expect(invoice.vatAmount!.equals(vatAmount)).toBe(true);
        expect(invoice.events).toHaveLength(1);
        expect(invoice.events[0]).toEqual(
            expect.objectContaining({
                name: 'invoice.created',
                data: {
                    id: expect.any(String),
                    lineItems: {
                        items: [
                            {
                                description: 'Item 1',
                                price: { amount: '50', currency: 'USD' },
                                quantity: '2',
                                total: { amount: '100', currency: 'USD' },
                            },
                            {
                                description: 'Item 2',
                                price: { amount: '100', currency: 'USD' },
                                quantity: '1',
                                total: { amount: '100', currency: 'USD' },
                            },
                        ],
                        subtotal: { amount: '200', currency: 'USD' },
                    },
                    total: { amount: '220', currency: 'USD' },
                    vatRate: '10',
                    vatAmount: { amount: '20', currency: 'USD' },
                    issueDate: '2023-01-01',
                    dueDate: '2028-01-01',
                    issuer: {
                        type: 'COMPANY',
                        name: 'Company Inc.',
                        address: '123 Main St, City, Country',
                        taxId: 'TAX123456',
                        email: 'info@company.com',
                    },
                    recipient: {
                        type: 'INDIVIDUAL',
                        name: 'Jane Smith',
                        address: '456 Another St, City, Country',
                        taxId: 'TAX654321',
                        email: 'jane.smith@example.com',
                        taxResidenceCountry: 'US',
                        billing: {
                            type: 'PAYPAL',
                            data: { email: 'customer@example.com' },
                        },
                    },
                },
            })
        );
    });

    it('should not create an invoice when due date is before issue date', () => {
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
        const issueDate = CalendarDate.create('2028-02-01').unwrap();
        const dueDate = CalendarDate.create('2023-01-01').unwrap();
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

        const vatRate = VatRate.create('10').unwrap();

        const invoice = Invoice.create({
            issueDate: issueDate,
            dueDate: dueDate,
            lineItems: lineItems,
            vatRate: vatRate,
            issuer: issuer,
            recipient: recipient,
        });

        expect(invoice.isError()).toBe(true);
        expect(invoice.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10000',
            })
        );
    });
});
