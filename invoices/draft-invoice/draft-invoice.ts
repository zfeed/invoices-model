import { randomUUID } from 'crypto';
import { DomainError, Result } from '../../building-blocks';
import { PublishableEvents } from '../../building-blocks/events';
import { CalendarDate } from '../calendar-date/calendar-date';
import { checkDates } from '../invoice/checks/check-dates';
import { Invoice } from '../invoice/invoice';
import { Issuer } from '../issuer/issuer';
import { LineItem } from '../line-item/line-item';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';
import { Money } from '../money/money/money';
import { Recipient } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';
import { checkDraftInvoiceComplete } from './checks/check-draft-invoice-complete';
import { checkLineItemsNotEmpty } from './checks/check-line-items-not-empty';
import { DraftInvoiceCreatedEvent } from './events/draft-invoice-created.event';
import { DraftInvoiceFinishedEvent } from './events/draft-invoice-finished.event';
import { DraftInvoiceUpdatedEvent } from './events/draft-invoice-updated.event';

export class DraftInvoice
    implements
        PublishableEvents<
            | DraftInvoiceCreatedEvent
            | DraftInvoiceUpdatedEvent
            | DraftInvoiceFinishedEvent
        >
{
    #id: string = randomUUID();
    #vatRate: VatRate | null;
    #vatAmount: Money | null;
    #total: Money | null;
    #lineItems: LineItems | null;
    #issueDate: CalendarDate | null;
    #dueDate: CalendarDate | null;
    #issuer: Issuer | null;
    #recipient: Recipient | null;
    #events: (
        | DraftInvoiceCreatedEvent
        | DraftInvoiceUpdatedEvent
        | DraftInvoiceFinishedEvent
    )[] = [];

    public get events(): ReadonlyArray<
        | DraftInvoiceCreatedEvent
        | DraftInvoiceUpdatedEvent
        | DraftInvoiceFinishedEvent
    > {
        return this.#events;
    }

    public get total(): Money | null {
        return this.#total;
    }

    public get vatRate(): VatRate | null {
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

    public get recipient(): Recipient | null {
        return this.#recipient;
    }

    private constructor(
        lineItems: LineItems | null = null,
        total: Money | null = null,
        vatRate: VatRate | null = null,
        vatAmount: Money | null = null,
        issueDate: CalendarDate | null = null,
        dueDate: CalendarDate | null = null,
        issuer: Issuer | null = null,
        recipient: Recipient | null = null
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

    public toInvoice(): Result<DomainError, Invoice> {
        const error = checkDraftInvoiceComplete({
            total: this.#total,
            vatRate: this.#vatRate,
            vatAmount: this.#vatAmount,
            issueDate: this.#issueDate,
            dueDate: this.#dueDate,
            recipient: this.#recipient,
            issuer: this.#issuer,
            lineItems: this.#lineItems,
        });

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

        this.#events.push(new DraftInvoiceFinishedEvent(this.toPlain()));

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

        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

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

        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    public applyVat(vatRate: VatRate): Result<DomainError, void> {
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
        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    public addRecipient(recipient: Recipient): Result<DomainError, void> {
        this.#recipient = recipient;
        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    public addDueDate(dueDate: CalendarDate): Result<DomainError, void> {
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

        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    public addIssueDate(issueDate: CalendarDate): Result<DomainError, void> {
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

        this.#events.push(new DraftInvoiceUpdatedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    public isValid(): boolean {
        const error = checkDraftInvoiceComplete({
            total: this.#total,
            vatRate: this.#vatRate,
            vatAmount: this.#vatAmount,
            issueDate: this.#issueDate,
            dueDate: this.#dueDate,
            recipient: this.#recipient,
            issuer: this.#issuer,
            lineItems: this.#lineItems,
        });

        if (error) {
            return false;
        }

        return true;
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

    static create() {
        const draftInvoice = new DraftInvoice();

        draftInvoice.#events.push(
            new DraftInvoiceCreatedEvent(draftInvoice.toPlain())
        );

        return Result.ok(draftInvoice);
    }

    toPlain() {
        return {
            id: this.#id,
            lineItems: this.#lineItems?.toPlain() ?? null,
            total: this.#total?.toPlain() ?? null,
            vatRate: this.#vatRate?.toPlain() ?? null,
            vatAmount: this.#vatAmount?.toPlain() ?? null,
            issueDate: this.#issueDate?.toString() ?? null,
            dueDate: this.#dueDate?.toString() ?? null,
            issuer: this.#issuer?.toPlain() ?? null,
            recipient: this.#recipient?.toPlain() ?? null,
        };
    }
}
