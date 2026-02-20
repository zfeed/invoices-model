import { Result } from '../../../../building-blocks';
import { Issuer } from '../issuer/issuer';
import { Money } from '../money/money/money';
import { Recipient } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';

import { PublishableEvents } from '../../../../building-blocks/events';
import { CalendarDate } from '../calendar-date/calendar-date';
import { Id } from '../id/id';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';
import { Status } from '../status/status';
import { checkDates } from './checks/check-dates';
import { InvoiceCancelledEvent } from './events/invoice-cancelled.event';
import { InvoiceIssuedEvent } from './events/invoice-issued.event';

export class Invoice
    implements
        PublishableEvents<InvoiceIssuedEvent | InvoiceCancelledEvent>
{
    #id: Id;
    #status: Status;
    #vatRate: VatRate | null;
    #vatAmount: Money | null;
    #total: Money;
    #lineItems: LineItems;
    #issueDate: CalendarDate;
    #dueDate: CalendarDate;
    #issuer: Issuer;
    #recipient: Recipient;
    #events: (InvoiceIssuedEvent | InvoiceCancelledEvent)[] = [];

    public get id(): Id {
        return this.#id;
    }

    public get status(): Status {
        return this.#status;
    }

    public get events(): ReadonlyArray<
        InvoiceIssuedEvent | InvoiceCancelledEvent
    > {
        return this.#events;
    }

    public get total(): Money {
        return this.#total;
    }

    public get vatRate(): VatRate | null {
        return this.#vatRate;
    }

    public get vatAmount(): Money | null {
        return this.#vatAmount;
    }

    public get lineItems(): ReadOnlyLineItems {
        return this.#lineItems;
    }

    public get issueDate(): CalendarDate {
        return this.#issueDate;
    }

    public get dueDate(): CalendarDate {
        return this.#dueDate;
    }

    public get issuer(): Issuer {
        return this.#issuer;
    }

    public get recipient(): Recipient {
        return this.#recipient;
    }

    protected constructor(
        id: Id,
        status: Status,
        lineItems: LineItems,
        total: Money,
        vatRate: VatRate | null,
        vatAmount: Money | null,
        issueDate: CalendarDate,
        dueDate: CalendarDate,
        issuer: Issuer,
        recipient: Recipient
    ) {
        this.#id = id;
        this.#status = status;
        this.#lineItems = lineItems;
        this.#total = total;
        this.#vatRate = vatRate;
        this.#vatAmount = vatAmount;
        this.#issueDate = issueDate;
        this.#dueDate = dueDate;
        this.#recipient = recipient;
        this.#issuer = issuer;
    }

    static create(options: {
        id: Id;
        lineItems: LineItems;
        issueDate: CalendarDate;
        dueDate: CalendarDate;
        issuer: Issuer;
        vatRate: VatRate | null;
        recipient: Recipient;
    }) {
        const issueDate = options.issueDate;
        const dueDate = options.dueDate;
        const issuer = options.issuer;
        const recipient = options.recipient;
        const vatRate = options.vatRate;
        const dateError = checkDates({ issueDate, dueDate });
        if (dateError) {
            return Result.error(dateError);
        }

        const total = vatRate
            ? vatRate.applyTo(options.lineItems.subtotal)
            : options.lineItems.subtotal;
        const vatAmount = vatRate
            ? total.subtract(options.lineItems.subtotal).unwrap()
            : null;
        const invoice = new Invoice(
            options.id,
            Status.issued(),
            options.lineItems,
            total,
            vatRate,
            vatAmount,
            issueDate,
            dueDate,
            issuer,
            recipient
        );

        const event = new InvoiceIssuedEvent(invoice.toPlain());

        invoice.#events.push(event);

        return Result.ok(invoice);
    }

    cancel() {
        this.#status = Status.cancelled();

        this.#events.push(
            new InvoiceCancelledEvent({
                id: this.#id.toString(),
                status: this.#status.toString(),
            })
        );
    }

    toPlain() {
        return {
            id: this.#id.toString(),
            status: this.#status.toString(),
            lineItems: this.#lineItems.toPlain(),
            total: this.#total.toPlain(),
            vatRate: this.#vatRate ? this.#vatRate.toPlain() : null,
            vatAmount: this.#vatAmount ? this.#vatAmount.toPlain() : null,
            issueDate: this.#issueDate.toString(),
            dueDate: this.#dueDate.toString(),
            issuer: this.#issuer.toPlain(),
            recipient: this.#recipient.toPlain(),
        };
    }
}
