import { Money } from "../money/money/money";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { assertLineItems } from "./asserts/assert-line-items";
import { Result } from "../../building-blocks";
import { Issuer } from "../issuer/issuer";
import { Recipient } from "../recipient/recipient";

import { IssueDate } from "../calendar-date/calendar-date";
import { IBilling } from "../recipient/billing/billing.interface";

export class Invoice<T, D, B extends IBilling<T, D>> {
    #vat: Vat;
    #total: Money;
    #lineItems: LineItem[];
    #issueDate: IssueDate;
    #dueDate: IssueDate;
    #issuer: Issuer;
    #recipient: Recipient<T, D, B>;

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

    public get issuer(): Issuer {
        return this.#issuer;
    }

    public get recipient(): Recipient<T, D, B> {
        return this.#recipient;
    }

    private constructor(
        lineItems: LineItem[],
        total: Money,
        vat: Vat,
        issueDate: IssueDate,
        dueDate: IssueDate,
        issuer: Issuer,
        recipient: Recipient<T, D, B>
    ) {
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vat = vat;
        this.#issueDate = issueDate;
        this.#dueDate = dueDate;
        this.#recipient = recipient;
        this.#issuer = issuer;
    }

    static create<T, D, B extends IBilling<T, D>>(options: {
        lineItems: LineItem[];
        issueDate: IssueDate;
        dueDate: IssueDate;
        issuer: Issuer;
        recipient: Recipient<T, D, B>;
    }) {
        const error = assertLineItems(options.lineItems);
        if (error) {
            return Result.error(error);
        }

        let total = options.lineItems[0].total;
        for (let i = 1; i < options.lineItems.length; i++) {
            const result = total.add(options.lineItems[i].total);
            if (result.isError()) {
                return result.error();
            }
            total = result.unwrap();
        }

        const issueDate = options.issueDate;
        const dueDate = options.dueDate;
        const issuer = options.issuer;
        const recipient = options.recipient;
        const invoice = new Invoice(
            options.lineItems,
            total,
            Vat.create("0"),
            issueDate,
            dueDate,
            issuer,
            recipient
        );

        return Result.ok(invoice);
    }

    applyVat(vat: Vat) {
        let baseTotal = this.#lineItems[0].total;
        for (let i = 1; i < this.#lineItems.length; i++) {
            const result = baseTotal.add(this.#lineItems[i].total);
            if (result.isError()) {
                return result.error();
            }
            baseTotal = result.unwrap();
        }
        const vatResult = vat.applyTo(baseTotal);

        if (vatResult.isError()) {
            return vatResult.error();
        }

        this.#total = vatResult.unwrap();
        this.#vat = vat;

        return Result.ok(this);
    }

    addLineItem(lineItem: LineItem) {
        const error = assertLineItems([...this.#lineItems, lineItem]);
        if (error) {
            return Result.error(error);
        }

        this.#lineItems.push(lineItem);
        const vatResult = this.#vat.applyTo(lineItem.total);
        if (vatResult.isError()) {
            return vatResult.error();
        }

        const result = this.#total.add(vatResult.unwrap());
        if (result.isError()) {
            return result.error();
        }
        this.#total = result.unwrap();

        return Result.ok(this);
    }

    removeLineItem(lineItem: LineItem) {
        const index = this.#lineItems.findIndex((item) =>
            item.equals(lineItem)
        );

        if (index === -1) {
            return Result.ok(undefined);
        }

        const removed = this.#lineItems[index];
        const newItems = [...this.#lineItems];

        newItems.splice(index, 1);

        const error = assertLineItems(newItems);

        if (error) {
            return Result.error(error);
        }

        this.#lineItems = newItems;

        let baseTotal = newItems[0].total;
        for (let i = 1; i < newItems.length; i++) {
            const result = baseTotal.add(newItems[i].total);
            if (result.isError()) {
                return result.error();
            }
            baseTotal = result.unwrap();
        }

        const result = this.#vat.applyTo(baseTotal);
        if (result.isError()) {
            return result.error();
        }
        this.#total = result.unwrap();

        return Result.ok(removed);
    }
}
