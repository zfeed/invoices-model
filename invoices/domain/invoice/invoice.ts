import { Result } from '../../../building-blocks';
import { Issuer } from '../issuer/issuer';
import { Money } from '../money/money/money';
import { Recipient } from '../recipient/recipient';
import { VatRate } from '../vat-rate/vat-rate';

import { PublishableEvents } from '../../../building-blocks/events';
import { CalendarDate } from '../calendar-date/calendar-date';
import { Id } from '../id/id';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';
import { checkDates } from './checks/check-dates';
import { InvoiceCreatedEvent } from './events/invoice-created.event';

export class Invoice implements PublishableEvents<InvoiceCreatedEvent> {
    #id: Id;
    #vatRate: VatRate | null;
    #vatAmount: Money | null;
    #total: Money;
    #lineItems: LineItems;
    #issueDate: CalendarDate;
    #dueDate: CalendarDate;
    #issuer: Issuer;
    #recipient: Recipient;
    #events: InvoiceCreatedEvent[] = [];

    public get id(): Id {
        return this.#id;
    }

    public get events(): ReadonlyArray<InvoiceCreatedEvent> {
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

    private constructor(
        id: Id,
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
            Id.create().unwrap(),
            options.lineItems,
            total,
            vatRate,
            vatAmount,
            issueDate,
            dueDate,
            issuer,
            recipient
        );

        const event = new InvoiceCreatedEvent(invoice.toPlain());

        invoice.#events.push(event);

        return Result.ok(invoice);
    }

    toPlain() {
        return {
            id: this.#id.toString(),
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
