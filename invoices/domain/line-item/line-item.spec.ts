import { testEquatable } from '../../../building-blocks/equatable.test-helper';
import { Money } from '../money/money/money';
import { LineItem } from './line-item';
import { UnitDescription } from './unit-description';
import { UnitQuantity } from './unit-quantity';

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
            lineItem.description.equals(UnitDescription.create('Product 1'))
        ).toBe(true);
        expect(
            lineItem.quantity.equals(UnitQuantity.create('4').unwrap())
        ).toBe(true);
        expect(lineItem.total.equals(Money.create('400', 'USD').unwrap())).toBe(
            true
        );
    });
});
