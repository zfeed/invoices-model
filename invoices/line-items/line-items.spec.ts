import { LineItem } from '../line-item/line-item';
import { LineItems } from './line-items';
import { Money } from '../money/money/money';

describe('LineItems', () => {
    it('should create line items', () => {
        const lineItem = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItems = LineItems.create({
            items: [lineItem],
        }).unwrap();

        expect(lineItems.length).toBe(1);
        expect(
            lineItems.subtotal.equals(Money.create('400', 'USD').unwrap())
        ).toBe(true);
        expect(
            lineItems.contains(
                LineItem.create({
                    description: 'Product 1',
                    price: {
                        amount: '100',
                        currency: 'USD',
                    },
                    quantity: '4',
                }).unwrap()
            )
        ).toBe(true);
    });

    it('should add a line item', () => {
        const lineItem1 = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItem2 = LineItem.create({
            description: 'Product 2',
            price: {
                amount: '200',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        const lineItems = LineItems.create({
            items: [lineItem1],
        }).unwrap();

        const updatedLineItems = lineItems.add(lineItem2).unwrap();

        expect(updatedLineItems.length).toBe(2);
        expect(
            updatedLineItems.subtotal.equals(
                Money.create('800', 'USD').unwrap()
            )
        ).toBe(true);
        expect(updatedLineItems.contains(lineItem1)).toBe(true);
        expect(updatedLineItems.contains(lineItem2)).toBe(true);
    });

    it('should remove a line item', () => {
        const lineItem1 = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItem2 = LineItem.create({
            description: 'Product 2',
            price: {
                amount: '200',
                currency: 'USD',
            },
            quantity: '2',
        }).unwrap();

        const lineItems = LineItems.create({
            items: [lineItem1, lineItem2],
        }).unwrap();

        const updatedLineItems = lineItems.remove(lineItem2).unwrap();

        expect(updatedLineItems.length).toBe(1);
        expect(
            updatedLineItems.subtotal.equals(
                Money.create('400', 'USD').unwrap()
            )
        ).toBe(true);
        expect(updatedLineItems.contains(lineItem1)).toBe(true);
        expect(updatedLineItems.contains(lineItem2)).toBe(false);
    });

    it('should not create empty line items', () => {
        const result = LineItems.create({ items: [] });

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1000',
            })
        );
    });

    it('should not create line items with different currencies', () => {
        const lineItem1 = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItem2 = LineItem.create({
            description: 'Product 2',
            price: {
                amount: '200',
                currency: 'EUR',
            },
            quantity: '2',
        }).unwrap();

        const result = LineItems.create({
            items: [lineItem1, lineItem2],
        });

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1001',
            })
        );
    });

    it('should not add a duplicate line item', () => {
        const lineItem1 = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItems = LineItems.create({
            items: [lineItem1],
        }).unwrap();

        const result = lineItems.add(lineItem1);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1002',
            })
        );
    });

    it('should leave line items empty when the last item is removed', () => {
        const lineItem1 = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        const lineItems = LineItems.create({
            items: [lineItem1],
        }).unwrap();

        const result = lineItems.remove(lineItem1);

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '1000',
            })
        );
    });
});
