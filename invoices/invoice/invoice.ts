import { Result } from '../../building-blocks';
import { Issuer } from '../issuer/issuer';
import { Money } from '../money/money/money';
import { Recipient } from '../recipient/recipient';
import { Vat } from '../vat/vat';

import { CalendarDate } from '../calendar-date/calendar-date';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items';
import { IBilling } from '../recipient/billing/billing.interface';
import { assertDates } from './asserts/assert-dates';

export class Invoice<T, D, B extends IBilling<T, D>> {
    #vatRate: Vat;
    #vatAmount: Money;
    #total: Money;
    #lineItems: LineItems;
    #issueDate: CalendarDate;
    #dueDate: CalendarDate;
    #issuer: Issuer;
    #recipient: Recipient<T, D, B>;

    public get total(): Money {
        return this.#total;
    }

    public get vatRate(): Vat {
        return this.#vatRate;
    }

    public get vatAmount(): Money {
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

    public get recipient(): Recipient<T, D, B> {
        return this.#recipient;
    }

    private constructor(
        lineItems: LineItems,
        total: Money,
        vatRate: Vat,
        vatAmount: Money,
        issueDate: CalendarDate,
        dueDate: CalendarDate,
        issuer: Issuer,
        recipient: Recipient<T, D, B>
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

    static create<T, D, B extends IBilling<T, D>>(options: {
        lineItems: LineItems;
        issueDate: CalendarDate;
        dueDate: CalendarDate;
        issuer: Issuer;
        vatRate: Vat;
        recipient: Recipient<T, D, B>;
    }) {
        const issueDate = options.issueDate;
        const dueDate = options.dueDate;
        const issuer = options.issuer;
        const recipient = options.recipient;
        const vatRate = options.vatRate;
        const dateError = assertDates({ issueDate, dueDate });
        if (dateError) {
            return Result.error(dateError);
        }

        const total = vatRate.applyTo(options.lineItems.subtotal);
        const vatAmount = total.subtract(options.lineItems.subtotal).unwrap();
        const invoice = new Invoice(
            options.lineItems,
            total,
            vatRate,
            vatAmount,
            issueDate,
            dueDate,
            issuer,
            recipient
        );

        return Result.ok(invoice);
    }
}
