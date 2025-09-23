import { Money } from "../money/money/money";
import { Vat } from "../vat/vat";
import { LineItem } from "../line-item/line-item";
import { Result } from "../../building-blocks";
import { Issuer } from "../issuer/issuer";
import { Recipient } from "../recipient/recipient";

import { IssueDate } from "../calendar-date/calendar-date";
import { IBilling } from "../recipient/billing/billing.interface";
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';

export class Invoice<T, D, B extends IBilling<T, D>> {
    #vat: Vat;
    #total: Money;
    #lineItems: LineItems;
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

    public get lineItems(): ReadOnlyLineItems {
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
        lineItems: LineItems,
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
        lineItems: LineItems;
        issueDate: IssueDate;
        dueDate: IssueDate;
        issuer: Issuer;
        recipient: Recipient<T, D, B>;
    }) {
        const subtotal = options.lineItems.subtotal;
        const total = options.lineItems.subtotal;

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
        const vatResult = vat.applyTo(this.lineItems.subtotal);

        if (vatResult.isError()) {
            return vatResult.error();
        }

        this.#total = vatResult.unwrap();
        this.#vat = vat;

        return Result.ok(this);
    }

    addLineItem(lineItem: LineItem) {
        const lineItems = this.#lineItems.add(lineItem);

        if (lineItems.isError()) {
            return lineItems.error();
        }

        this.#lineItems = lineItems.unwrap();
    
        this.#calculateTotal();

        return Result.ok(this);
    }

    removeLineItem(lineItem: LineItem) {
        const lineItemsResult = this.#lineItems.remove(lineItem);

        if (lineItemsResult.isError()) {
            return lineItemsResult.error();
        }

        const lineItems = lineItemsResult.unwrap();
        
        const isRemoved = lineItems.length !== this.#lineItems.length;

        if (!isRemoved) {
            return Result.ok(undefined);
        }

        this.#lineItems = lineItems;

        this.#calculateTotal();

        return Result.ok(lineItem);
    }

    #calculateTotal(): void {
        const subtotal = this.#lineItems.subtotal;

        const total = this.#vat ? this.#vat.applyTo(subtotal).unwrap() : subtotal;

        this.#total = total;
    }
    
}
