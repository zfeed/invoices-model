import { Money } from "../money/money/money";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { assertLineItems, InvalidLineItemsError } from "./asserts/assert-line-items";

export class Invoice {
    #vat: Vat;
    #total: Money;
    #lineItems: LineItem[];

    public get total(): Money {
        return this.#total;
    }

    public get vat(): Vat {
        return this.#vat;
    }

    public get lineItems(): ReadonlyArray<LineItem> {
        return this.#lineItems;
    }

    private constructor(lineItems: LineItem[], total: Money, vat: Vat) {
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vat = vat;
    }

    static create(options: { lineItems: LineItem[] }) {
        assertLineItems(options.lineItems);

        // Calculate total from all line items
        let total = options.lineItems[0].total;
        for (let i = 1; i < options.lineItems.length; i++) {
            total = total.add(options.lineItems[i].total);
        }

        return new Invoice(options.lineItems, total, Vat.fromPercent("0"));
    }

    applyVat(vat: Vat) {
        const money = vat.applyTo(this.total);

        this.#total = money;
        this.#vat = vat;
    }

    addLineItem(lineItem: LineItem) {
        assertLineItems([...this.#lineItems, lineItem]);
        this.#lineItems.push(lineItem);
        this.#total = this.#total.add(this.#vat.applyTo(lineItem.total));
    }

    removeLineItem(lineItem: LineItem) {
        const index = this.#lineItems.findIndex(item => item.equals(lineItem));

        if (index === -1) {
            return;
        }
    
        const removed = this.#lineItems[index];
        const newItems = [...this.#lineItems];

        newItems.splice(index, 1);
    
        assertLineItems(newItems);
        this.#lineItems = newItems;
    
        let baseTotal = newItems[0].total;
        for (let i = 1; i < newItems.length; i++) {
            baseTotal = baseTotal.add(newItems[i].total);
        }
        this.#total = this.#vat.applyTo(baseTotal);
        return removed;
    }
}
