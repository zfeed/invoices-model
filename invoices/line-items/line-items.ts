import { LineItem } from "../line-item/line-item";
import { Money } from "../money/money/money";
import { Result, DomainError } from "../../building-blocks";
import { assertNonEmpty } from "./asserts/assert-non-empty";
import { assertSameCurrency } from "./asserts/assert-same-currency";
import { assertNoDuplicate } from "./asserts/assert-no-duplicate";

export class LineItems {
    #items: LineItem[];
    #subtotal: Money;

    private constructor(items: LineItem[], subtotal: Money) {
        this.#items = items;
        this.#subtotal = subtotal;
    }

    get length(): number {
        return this.#items.length;
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
        
    get subtotal(): Money {
        return this.#subtotal;
    }

    contains(lineItem: LineItem): boolean {
        return this.#items.some(item => item.equals(lineItem));
    }

    add(lineItem: LineItem) {
        return LineItems.create({ items: [...this.#items, lineItem] });
    }

    remove(lineItem: LineItem) {
        const lineItems = this.#items.filter(item => !item.equals(lineItem));

        return LineItems.create({ items: lineItems });
    }

    find(predicate: (item: LineItem) => boolean): LineItem | undefined {
        return this.#items.find(predicate);
    }

    static create({ items }: { items: LineItem[] }) {
        const duplicateError = assertNoDuplicate(items);
    
        if (duplicateError) {
            return Result.error(duplicateError);
        }

        const emptyError = assertNonEmpty(items);
    
        if (emptyError) {
            return Result.error(emptyError);
        }

        const currencyError = assertSameCurrency(items);
    
        if (currencyError) {
            return Result.error(currencyError);
        }
        
        const subtotal = this.calculateSubtotal(items);
    
        return Result.ok(new LineItems(items, subtotal));
    }
}

export type ReadOnlyLineItems = Pick<LineItems, 'length' | 'subtotal' | 'contains' | 'find'>;