import { Money } from "../money/money/money";
import { Vat } from "../vat/vat";
import { LineItems, ReadOnlyLineItems } from "../line-items/line-items";
import { Result, DomainError, DOMAIN_ERROR_CODE } from "../../building-blocks";
import { Issuer } from "../issuer/issuer";
import { Recipient } from "../recipient/recipient";
import { IssueDate } from "../calendar-date/calendar-date";
import { IBilling } from "../recipient/billing/billing.interface";
import { Invoice } from "../invoice/invoice";
import { assertDraftInvoiceComplete } from "./asserts/assert-draft-invoice-complete";
import { LineItem } from "../line-item/line-item";

export class DraftInvoice<T, D, B extends IBilling<T, D>> {
    #vat: Vat | null;
    #total: Money | null;
    #lineItems: LineItems | null;
    #issueDate: IssueDate | null;
    #dueDate: IssueDate | null;
    #issuer: Issuer | null;
    #recipient: Recipient<T, D, B> | null;

    public get total(): Money | null {
        return this.#total;
    }

    public get vat(): Vat | null {
        return this.#vat;
    }

    public get lineItems(): ReadOnlyLineItems | null {
        return this.#lineItems;
    }

    public get issueDate(): IssueDate | null {
        return this.#issueDate;
    }

    public get dueDate(): IssueDate | null {
        return this.#dueDate;
    }

    public get issuer(): Issuer | null {
        return this.#issuer;
    }

    public get recipient(): Recipient<T, D, B> | null {
        return this.#recipient;
    }

    private constructor(
        lineItems: LineItems | null = null,
        total: Money | null = null,
        vat: Vat | null = null,
        issueDate: IssueDate | null = null,
        dueDate: IssueDate | null = null,
        issuer: Issuer | null = null,
        recipient: Recipient<T, D, B> | null = null
    ) {
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vat = vat;
        this.#issueDate = issueDate;
        this.#dueDate = dueDate;
        this.#recipient = recipient;
        this.#issuer = issuer;
    }

    public toInvoice(): Result<DomainError, Invoice<T, D, B>> {
        const error = assertDraftInvoiceComplete(
            this.#total,
            this.#vat,
            this.#lineItems,
            this.#issueDate,
            this.#dueDate,
            this.#issuer,
            this.#recipient
        );
        
        if (error) {
            return Result.error(error);
        }

        const result = Invoice.create({
            lineItems: this.#lineItems!,
            issueDate: this.#issueDate!,
            dueDate: this.#dueDate!,
            issuer: this.#issuer!,
            recipient: this.#recipient!
        })

        return result;
    }

    public addLineItem(lineItem: LineItem) {
        let lineItemsResult;

        if (this.#lineItems === null) {
            lineItemsResult = LineItems.create({ items: [lineItem] });
        } else {
            lineItemsResult = this.#lineItems.add(lineItem);
        }

        if (lineItemsResult.isError()) {
            return lineItemsResult.error();
        }

        this.#lineItems = lineItemsResult.unwrap();

        this.#calculateTotal();
    }

    #calculateTotal(): void {
        if (this.#lineItems === null) {
            this.#total = null;
            return;
        }

        const subtotal = this.#lineItems.subtotal;

        const total = this.#vat ? this.#vat.applyTo(subtotal).unwrap() : subtotal;

        this.#total = total;
    }

    static create<T, D, B extends IBilling<T, D>>() {
        const draftInvoice = new DraftInvoice<T, D, B>();
        return Result.ok(draftInvoice);
    }
}