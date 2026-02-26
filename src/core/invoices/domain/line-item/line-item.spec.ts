import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
import { Money } from '../money/money/money';
import { LineItem } from './line-item';
import { UnitDescription } from './unit-description/unit-description';
import { UnitQuantity } from './unit-quantity/unit-quantity';

describe('LineItem', () => {
    testEquatable({
        typeName: 'LineItem',
        createEqual: () => [
            LineItem.create({
                description: 'Product A',
                price: { amount: '100', currency: 'USD' },
                quantity: '2',
            }).unwrap(),
            LineItem.create({
                description: 'Product A',
                price: { amount: '100', currency: 'USD' },
                quantity: '2',
            }).unwrap(),
            LineItem.create({
                description: 'Product A',
                price: { amount: '100', currency: 'USD' },
                quantity: '2',
            }).unwrap(),
        ],
        createDifferent: () => [
            LineItem.create({
                description: 'Product A',
                price: { amount: '100', currency: 'USD' },
                quantity: '2',
            }).unwrap(),
            LineItem.create({
                description: 'Product B',
                price: { amount: '200', currency: 'USD' },
                quantity: '3',
            }).unwrap(),
        ],
    });

    it('should create a line item', () => {
        const price = Money.create('100', 'USD').unwrap();
        const lineItem = LineItem.create({
            description: 'Product 1',
            price: {
                amount: '100',
                currency: 'USD',
            },
            quantity: '4',
        }).unwrap();

        expect(lineItem.price.equals(price)).toBe(true);
        expect(
            lineItem.description.equals(
                UnitDescription.create('Product 1').unwrap()
            )
        ).toBe(true);
        expect(
            lineItem.quantity.equals(UnitQuantity.create('4').unwrap())
        ).toBe(true);
        expect(lineItem.total.equals(Money.create('400', 'USD').unwrap())).toBe(
            true
        );
    });

    it('should not create a line item with empty description', () => {
        const result = LineItem.create({
            description: '',
            price: { amount: '100', currency: 'USD' },
            quantity: '2',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '15000' })
        );
    });

    it('should not create a line item with invalid quantity', () => {
        const result = LineItem.create({
            description: 'Product A',
            price: { amount: '100', currency: 'USD' },
            quantity: '-1',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '2001' })
        );
    });

    it('should not create a line item with invalid currency', () => {
        const result = LineItem.create({
            description: 'Product A',
            price: { amount: '100', currency: 'INVALID' },
            quantity: '2',
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '5000' })
        );
    });

    it('should calculate total correctly', () => {
        const lineItem = LineItem.create({
            description: 'Service',
            price: { amount: '250', currency: 'EUR' },
            quantity: '3',
        }).unwrap();

        expect(lineItem.total.equals(Money.create('750', 'EUR').unwrap())).toBe(
            true
        );
    });

    describe('toPlain / fromPlain', () => {
        it('round-trips through toPlain and fromPlain', () => {
            const lineItem = LineItem.create({
                description: 'Product A',
                price: { amount: '100', currency: 'USD' },
                quantity: '2',
            }).unwrap();

            const restored = LineItem.fromPlain(lineItem.toPlain());

            expect(restored.equals(lineItem)).toBe(true);
        });
    });
});
