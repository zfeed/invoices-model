import { Equatable, Mappable, Result } from '../../../../shared/index.ts';
import { LineItem } from '../line-item/line-item.ts';
import { Money } from '../money/money/money.ts';
import { checkNoDuplicate } from './checks/check-no-duplicate.ts';
import { checkNonEmpty } from './checks/check-non-empty.ts';
import { checkSameCurrency } from './checks/check-same-currency.ts';

export class LineItems
    implements
        Equatable<ReadOnlyLineItems>,
        Mappable<ReturnType<LineItems['toPlain']>>
{
    protected _items: LineItem[];
    protected _subtotal: Money;

    protected constructor(items: LineItem[], subtotal: Money) {
        this._items = items;
        this._subtotal = subtotal;
    }

    get length(): number {
        return this._items.length;
    }

    get subtotal(): Money {
        return this._subtotal;
    }

    private static calculateSubtotal(items: LineItem[]): Money {
        let total = items[0].total;

        for (let i = 1; i < items.length; i++) {
            const addResult = total.add(items[i].total);
            if (addResult.isError()) {
                throw addResult.unwrapError();
            }
            total = addResult.unwrap();
        }

        return total;
    }

    forEach(callback: (item: LineItem) => void) {
        this._items.forEach(callback);
    }

    contains(lineItem: LineItem): boolean {
        return this._items.some((item) => item.equals(lineItem));
    }

    add(lineItem: LineItem) {
        return LineItems.create({ items: [...this._items, lineItem] });
    }

    remove(lineItem: LineItem) {
        const lineItems = this._items.filter((item) => !item.equals(lineItem));

        return LineItems.create({ items: lineItems });
    }

    find(predicate: (item: LineItem) => boolean): LineItem | undefined {
        return this._items.find(predicate);
    }

    equals(other: ReadOnlyLineItems): boolean {
        if (other instanceof LineItems === false) {
            throw new Error('Invalid argument type');
        }

        return this._items.every((item, index) =>
            item.equals(other._items[index])
        );
    }

    static create({ items }: { items: LineItem[] }) {
        const duplicateError = checkNoDuplicate(items);

        if (duplicateError) {
            return Result.error(duplicateError);
        }

        const emptyError = checkNonEmpty(items);

        if (emptyError) {
            return Result.error(emptyError);
        }

        const currencyError = checkSameCurrency(items);

        if (currencyError) {
            return Result.error(currencyError);
        }

        const subtotal = this.calculateSubtotal(items);

        return Result.ok(new LineItems(items, subtotal));
    }

    toPlain() {
        return {
            items: this._items.map((item) => item.toPlain()),
            subtotal: this._subtotal.toPlain(),
        };
    }
}

export type ReadOnlyLineItems = Pick<
    LineItems,
    'length' | 'subtotal' | 'contains' | 'find' | 'equals' | 'forEach'
>;
