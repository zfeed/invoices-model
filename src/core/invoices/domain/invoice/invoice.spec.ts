import { CalendarDate } from '../calendar-date/calendar-date';
import { Id } from '../id/id';
import { Issuer, ISSUER_TYPE } from '../issuer/issuer';
import { LineItem } from '../line-item/line-item';
import { LineItems } from '../line-items/line-items';
import { Money } from '../money/money/money';
import { Paypal } from '../billing/paypal/paypal';
import { Recipient, RECIPIENT_TYPE } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';
import { InvoiceStatus } from '../status/invoice-status';
import { Invoice } from './invoice';

const createLineItem = (description = 'Item 1', amount = '50', quantity = '2') =>
    LineItem.create({
        description,
        price: { amount, currency: 'USD' },
        quantity,
    }).unwrap();

const createIssuer = () =>
    Issuer.create({
        type: ISSUER_TYPE.COMPANY,
        name: 'Company Inc.',
        address: '123 Main St, City, Country',
        taxId: 'TAX123456',
        email: 'info@company.com',
    }).unwrap();

const createRecipient = () => {
    const billing = Paypal.create({ email: 'customer@example.com' }).unwrap();
    return Recipient.create({
        type: RECIPIENT_TYPE.INDIVIDUAL,
        name: 'Jane Smith',
        address: '456 Another St, City, Country',
        taxId: 'TAX654321',
        email: 'jane.smith@example.com',
        taxResidenceCountry: 'US',
        billing,
    }).unwrap();
};

const createIssuedInvoice = (options?: { vatRate?: VatRate | null; items?: LineItem[] }) => {
    const items = options?.items ?? [createLineItem()];
    const lineItems = LineItems.create({ items }).unwrap();
    return Invoice.create({
        id: Id.create().unwrap(),
        issueDate: CalendarDate.create('2023-01-01').unwrap(),
        dueDate: CalendarDate.create('2028-01-01').unwrap(),
        lineItems,
        vatRate: options?.vatRate ?? null,
        issuer: createIssuer(),
        recipient: createRecipient(),
    }).unwrap();
};

describe('Invoice', () => {
    it('should create an invoice', () => {
        const lineItem1 = createLineItem('Item 1', '50', '2');
        const lineItem2 = createLineItem('Item 2', '100', '1');
        const issueDate = CalendarDate.create('2023-01-01').unwrap();
        const dueDate = CalendarDate.create('2028-01-01').unwrap();
        const issuer = createIssuer();
        const recipient = createRecipient();
        const lineItems = LineItems.create({ items: [lineItem1, lineItem2] }).unwrap();
        const vatRate = VatRate.create('10').unwrap();
        const vatAmount = Money.create('20', 'USD').unwrap();

        const invoice = Invoice.create({
            id: Id.create().unwrap(),
            issueDate,
            dueDate,
            lineItems,
            vatRate,
            issuer,
            recipient,
        }).unwrap();

        expect(invoice.total.equals(Money.create('220', 'USD').unwrap())).toBe(true);
        expect(
            invoice.lineItems.subtotal.equals(Money.create('200', 'USD').unwrap())
        ).toBe(true);
        expect(invoice.vatRate!.equals(VatRate.create('10').unwrap())).toBe(true);
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
        expect(invoice.status.equals(InvoiceStatus.issued())).toBe(true);
        expect(invoice.issueDate.equals(issueDate)).toBe(true);
        expect(invoice.dueDate.equals(dueDate)).toBe(true);
        expect(invoice.issuer.equals(issuer)).toBe(true);
        expect(invoice.recipient.type).toBe('INDIVIDUAL');
        expect(invoice.vatRate!.equals(vatRate)).toBe(true);
        expect(invoice.vatAmount!.equals(vatAmount)).toBe(true);
        expect(invoice.events).toHaveLength(1);
        expect(invoice.events[0]).toEqual(
            expect.objectContaining({
                name: 'invoice.issued',
                data: {
                    id: expect.any(String),
                    status: 'ISSUED',
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
                    vatRate: '0.1',
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

    it('should process an issued invoice', () => {
        const invoice = createIssuedInvoice();

        const result = invoice.process();

        expect(result.isOk()).toBe(true);
        expect(invoice.status.equals(InvoiceStatus.processing())).toBe(true);
        expect(invoice.events).toHaveLength(2);
        expect(invoice.events[1]).toEqual(
            expect.objectContaining({
                name: 'invoice.processing',
                data: expect.objectContaining({
                    id: expect.any(String),
                    status: 'PROCESSING',
                    lineItems: expect.any(Object),
                    total: { amount: '100', currency: 'USD' },
                    issueDate: '2023-01-01',
                    dueDate: '2028-01-01',
                }),
            })
        );
    });

    it('should not process a cancelled invoice', () => {
        const invoice = createIssuedInvoice();

        invoice.cancel().unwrap();
        const result = invoice.process();

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10001',
            })
        );
    });

    it('should cancel an invoice', () => {
        const invoice = createIssuedInvoice();

        invoice.cancel();

        expect(invoice.status.equals(InvoiceStatus.cancelled())).toBe(true);
        expect(invoice.events).toHaveLength(2);
        expect(invoice.events[1]).toEqual(
            expect.objectContaining({
                name: 'invoice.cancelled',
                data: expect.objectContaining({
                    id: expect.any(String),
                    status: 'CANCELLED',
                    lineItems: expect.any(Object),
                    total: { amount: '100', currency: 'USD' },
                    issueDate: '2023-01-01',
                    dueDate: '2028-01-01',
                }),
            })
        );
    });

    it('should pay a processing invoice', () => {
        const invoice = createIssuedInvoice();

        invoice.process().unwrap();
        const result = invoice.pay();

        expect(result.isOk()).toBe(true);
        expect(invoice.status.equals(InvoiceStatus.paid())).toBe(true);
        expect(invoice.events).toHaveLength(3);
        expect(invoice.events[2]).toEqual(
            expect.objectContaining({
                name: 'invoice.paid',
                data: expect.objectContaining({
                    id: expect.any(String),
                    status: 'PAID',
                    lineItems: expect.any(Object),
                    total: { amount: '100', currency: 'USD' },
                    issueDate: '2023-01-01',
                    dueDate: '2028-01-01',
                }),
            })
        );
    });

    it('should not pay an issued invoice', () => {
        const invoice = createIssuedInvoice();

        const result = invoice.pay();

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10001',
            })
        );
    });

    it('should fail a processing invoice', () => {
        const invoice = createIssuedInvoice();

        invoice.process().unwrap();
        const result = invoice.fail();

        expect(result.isOk()).toBe(true);
        expect(invoice.status.equals(InvoiceStatus.failed())).toBe(true);
        expect(invoice.events).toHaveLength(3);
        expect(invoice.events[2]).toEqual(
            expect.objectContaining({
                name: 'invoice.failed',
                data: expect.objectContaining({
                    id: expect.any(String),
                    status: 'FAILED',
                    lineItems: expect.any(Object),
                    total: { amount: '100', currency: 'USD' },
                    issueDate: '2023-01-01',
                    dueDate: '2028-01-01',
                }),
            })
        );
    });

    it('should not fail an issued invoice', () => {
        const invoice = createIssuedInvoice();

        const result = invoice.fail();

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10001',
            })
        );
    });

    it('should not cancel a processing invoice', () => {
        const invoice = createIssuedInvoice();

        invoice.process().unwrap();
        const result = invoice.cancel();

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10001',
            })
        );
    });

    it('should not create an invoice when due date is before issue date', () => {
        const lineItem1 = createLineItem('Item 1', '50', '2');
        const lineItem2 = createLineItem('Item 2', '100', '1');
        const lineItems = LineItems.create({ items: [lineItem1, lineItem2] }).unwrap();
        const vatRate = VatRate.create('10').unwrap();

        const invoice = Invoice.create({
            id: Id.create().unwrap(),
            issueDate: CalendarDate.create('2028-02-01').unwrap(),
            dueDate: CalendarDate.create('2023-01-01').unwrap(),
            lineItems,
            vatRate,
            issuer: createIssuer(),
            recipient: createRecipient(),
        });

        expect(invoice.isError()).toBe(true);
        expect(invoice.unwrapError()).toEqual(
            expect.objectContaining({
                code: '10000',
            })
        );
    });
});
