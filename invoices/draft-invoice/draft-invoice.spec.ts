import { LineItem } from '../line-item/line-item';
import { Money } from '../money/money/money';
import { Vat } from '../vat/vat';
import { DraftInvoice } from './draft-invoice';

describe('DraftInvoice', () => {
    it('should create a draft invoice instance with missing data', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        expect(draftInvoice.total).toBeNull();
        expect(draftInvoice.vatRate).toBeNull();
        expect(draftInvoice.vatAmount).toBeNull();
        expect(draftInvoice.lineItems).toBeNull();
        expect(draftInvoice.issueDate).toBeNull();
        expect(draftInvoice.dueDate).toBeNull();
        expect(draftInvoice.issuer).toBeNull();
        expect(draftInvoice.recipient).toBeNull();
    });

    it('should not create an invoice from draft invoice if draft is incomplete', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const result = draftInvoice.toInvoice();

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '8000',
            })
        );
    });

    it('should add line item to draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        draftInvoice.addLineItem(lineItem1)?.unwrap();

        expect(draftInvoice.lineItems?.length).toBe(1);
        expect(
            draftInvoice.lineItems?.find((lineItem) =>
                lineItem.equals(lineItem1)
            )
        ).toBeDefined();
        expect(
            draftInvoice.total?.equals(Money.create('100', 'USD').unwrap())
        ).toBe(true);
        expect(draftInvoice.vatAmount).toBeNull();
    });

    it('should remove line item from draft invoice', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

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

        draftInvoice.addLineItem(lineItem1)?.unwrap();
        draftInvoice.addLineItem(lineItem2)?.unwrap();
        draftInvoice.removeLineItem(lineItem1)?.unwrap();

        expect(draftInvoice.lineItems?.length).toBe(1);
        expect(
            draftInvoice.lineItems?.find((lineItem) =>
                lineItem.equals(lineItem1)
            )
        ).toBeUndefined();
        expect(
            draftInvoice.total?.equals(Money.create('100', 'USD').unwrap())
        ).toBe(true);
    });

    it('should add not apply vat to invoice with no line items', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const vat = Vat.create('20').unwrap();

        const result = draftInvoice.applyVat(vat);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '8001',
            })
        );
    });

    it('should apply vat to draft invoice with line items', () => {
        const draftInvoice = DraftInvoice.create().unwrap();

        const lineItem1 = LineItem.create({
            description: 'Item 1',
            price: {
                amount: '50',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        draftInvoice.addLineItem(lineItem1).unwrap();

        const vat = Vat.create('20').unwrap();

        draftInvoice.applyVat(vat).unwrap();

        expect(draftInvoice.vatRate?.equals(vat)).toBe(true);
        expect(
            draftInvoice.vatAmount?.equals(Money.create('20', 'USD').unwrap())
        ).toBe(true);
        expect(
            draftInvoice.total?.equals(Money.create('120', 'USD').unwrap())
        ).toBe(true);
    });
});
