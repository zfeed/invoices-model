import { Money } from "../money/money/money";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { assertLineItems } from "./asserts/assert-line-items";
import { left, right } from "@sweet-monads/either";

import { IssueDate } from "../calendar-date/calendar-date";
export class Invoice {
    #vat: Vat;
    #total: Money;
    #lineItems: LineItem[];
    #issueDate: IssueDate;
    #dueDate: IssueDate;

    public get total(): Money {
        return this.#total;
    }

    public get vat(): Vat {
        return this.#vat;
    }

    public get lineItems(): ReadonlyArray<LineItem> {
        return this.#lineItems;
    }

    public get issueDate(): IssueDate {
        return this.#issueDate;
    }

    public get dueDate(): IssueDate {
        return this.#dueDate;
    }

    private constructor(lineItems: LineItem[], total: Money, vat: Vat, issueDate: IssueDate, dueDate: IssueDate) {
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vat = vat;
        this.#issueDate = issueDate;
        this.#dueDate = dueDate;
    }

    static create(options: { lineItems: LineItem[]; issueDate: IssueDate; dueDate: IssueDate }) {
        const error = assertLineItems(options.lineItems);
        if (error) {
            return left(error);
        }

        let total = options.lineItems[0].total;
        for (let i = 1; i < options.lineItems.length; i++) {
            const result = total.add(options.lineItems[i].total);
            if (result.isLeft()) {
                return left(result.value);
            }
            total = result.unwrap();
        }

        const issueDate = options.issueDate;
        const dueDate = options.dueDate;
        const invoice = new Invoice(options.lineItems, total, Vat.fromPercent("0"), issueDate, dueDate);

        return right(invoice);
    }

    applyVat(vat: Vat) {
        let baseTotal = this.#lineItems[0].total;
        for (let i = 1; i < this.#lineItems.length; i++) {
            const result = baseTotal.add(this.#lineItems[i].total);
            if (result.isLeft()) {
                return left(result.value);
            }
            baseTotal = result.unwrap();
        }
        const vatResult = vat.applyTo(baseTotal);

        if (vatResult.isLeft()) {
            return left(vatResult.value);
        }

        this.#total = vatResult.unwrap();
        this.#vat = vat;

        return right(this);
    }

    addLineItem(lineItem: LineItem) {
        const error = assertLineItems([...this.#lineItems, lineItem]);
        if (error) {
            return left(error);
        }

        this.#lineItems.push(lineItem);
        const vatResult = this.#vat.applyTo(lineItem.total);
        if (vatResult.isLeft()) {
            return left(vatResult.value);
        }

        const result = this.#total.add(vatResult.unwrap());
        if (result.isLeft()) {
            return left(result.value);
        }
        this.#total = result.unwrap();

        return right(this);
    }

    removeLineItem(lineItem: LineItem) {
        const index = this.#lineItems.findIndex(item => item.equals(lineItem));

        if (index === -1) {
            return right(undefined);
        }
    
        const removed = this.#lineItems[index];
        const newItems = [...this.#lineItems];

        newItems.splice(index, 1);
    
        const error = assertLineItems(newItems);

        if (error) {
            return left(error);
        }

        this.#lineItems = newItems;
    
        let baseTotal = newItems[0].total;
        for (let i = 1; i < newItems.length; i++) {
            const result = baseTotal.add(newItems[i].total);
            if (result.isLeft()) {
                return left(result.value);
            }
            baseTotal = result.unwrap();
        }

        const result = this.#vat.applyTo(baseTotal);
        if (result.isLeft()) {
            return left(result.value);
        }
        this.#total = result.unwrap();

        return right(removed);
    }
}
