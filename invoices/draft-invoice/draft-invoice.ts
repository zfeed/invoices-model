import { DomainError, Result } from '../../building-blocks';
import { CalendarDate } from '../calendar-date/calendar-date';
import { checkDates } from '../invoice/checks/check-dates';
import { Invoice } from '../invoice/invoice';
import { Issuer } from '../issuer/issuer';
import { LineItem } from '../line-item/line-item';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';
import { Money } from '../money/money/money';
import { IBilling } from '../recipient/billing/billing.interface';
import { Recipient } from '../recipient/recipient';
import { Vat } from '../vat/vat';
import { checkDraftInvoiceComplete } from './checks/check-draft-invoice-complete';
import { checkLineItemsNotEmpty } from './checks/check-line-items-not-empty';

export class DraftInvoice<T, D, B extends IBilling<T, D>> {
    #vatRate: Vat | null;
    #vatAmount: Money | null;
    #total: Money | null;
    #lineItems: LineItems | null;
    #issueDate: CalendarDate | null;
    #dueDate: CalendarDate | null;
    #issuer: Issuer | null;
    #recipient: Recipient<T, D, B> | null;

    public get total(): Money | null {
        return this.#total;
    }

    public get vatRate(): Vat | null {
        return this.#vatRate;
    }

    public get vatAmount(): Money | null {
        return this.#vatAmount;
    }

    public get lineItems(): ReadOnlyLineItems | null {
        return this.#lineItems;
    }

    public get issueDate(): CalendarDate | null {
        return this.#issueDate;
    }

    public get dueDate(): CalendarDate | null {
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
        vatRate: Vat | null = null,
        vatAmount: Money | null = null,
        issueDate: CalendarDate | null = null,
        dueDate: CalendarDate | null = null,
        issuer: Issuer | null = null,
        recipient: Recipient<T, D, B> | null = null
    ) {
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vatRate = vatRate;
        this.#vatAmount = vatAmount;
        this.#issueDate = issueDate;
        this.#dueDate = dueDate;
        this.#recipient = recipient;
        this.#issuer = issuer;
    }

    public toInvoice(): Result<DomainError, Invoice<T, D, B>> {
        const error = checkDraftInvoiceComplete(
            this.#total,
            this.#vatRate,
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
            vatRate: this.#vatRate!,
            dueDate: this.#dueDate!,
            issuer: this.#issuer!,
            recipient: this.#recipient!,
        });

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

        return Result.ok(undefined);
    }

    public removeLineItem(lineItem: LineItem) {
        const error = checkLineItemsNotEmpty(this.#lineItems);

        if (error) {
            return Result.error(error);
        }

        const lineItemsResult = this.#lineItems!.remove(lineItem);

        if (lineItemsResult.isError()) {
            return lineItemsResult.error();
        }

        this.#lineItems = lineItemsResult.unwrap();

        this.#calculateTotal();

        return Result.ok(undefined);
    }

    public applyVat(vatRate: Vat): Result<DomainError, void> {
        const error = checkLineItemsNotEmpty(this.#lineItems);

        if (error) {
            return Result.error(error);
        }

        this.#vatRate = vatRate;
        this.#calculateTotal();

        return Result.ok(undefined);
    }

    public addIssuer(issuer: Issuer): Result<DomainError, void> {
        this.#issuer = issuer;
        return Result.ok(undefined);
    }

    public addRecipient(
        recipient: Recipient<T, D, B>
    ): Result<DomainError, void> {
        this.#recipient = recipient;
        return Result.ok(undefined);
    }

    public addDueDate(dueDate: CalendarDate): Result<DomainError, void> {
        // Validate dates if issue date is already set
        if (this.#issueDate !== null) {
            const dateError = checkDates({
                issueDate: this.#issueDate,
                dueDate,
            });
            if (dateError) {
                return Result.error(dateError);
            }
        }

        this.#dueDate = dueDate;
        return Result.ok(undefined);
    }

    public addIssueDate(issueDate: CalendarDate): Result<DomainError, void> {
        // Validate dates if due date is already set
        if (this.#dueDate !== null) {
            const dateError = checkDates({
                issueDate,
                dueDate: this.#dueDate,
            });
            if (dateError) {
                return Result.error(dateError);
            }
        }

        this.#issueDate = issueDate;
        return Result.ok(undefined);
    }

    public isValid(): boolean {
        return (
            this.#issuer !== null &&
            this.#recipient !== null &&
            this.#dueDate !== null &&
            this.#issueDate !== null &&
            this.#lineItems !== null &&
            this.#total !== null &&
            this.#vatAmount !== null
        );
    }

    #calculateTotal(): void {
        if (this.#lineItems === null) {
            this.#total = null;
            return;
        }

        const subtotal = this.#lineItems.subtotal;

        const total = this.#vatRate
            ? this.#vatRate.applyTo(subtotal)
            : subtotal;
        const vatAmount = this.#vatRate
            ? total.subtract(subtotal).unwrap()
            : null;

        this.#total = total;
        this.#vatAmount = vatAmount;
    }

    static create<T, D, B extends IBilling<T, D>>() {
        const draftInvoice = new DraftInvoice<T, D, B>();
        return Result.ok(draftInvoice);
    }
}
