import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../shared/index.ts';
import { Issuer } from '../issuer/issuer.ts';
import { Money } from '../money/money/money.ts';
import { Recipient } from '../recipient/recipient.ts';
import { VatRate } from '../vat-rate/vat-rate.ts';

import { PublishableEvents } from '../../../../shared/events/index.ts';
import { CalendarDate } from '../calendar-date/calendar-date.ts';
import { Id } from '../id/id.ts';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items.ts';
import { InvoiceStatus } from '../status/invoice-status.ts';
import { checkDates } from './checks/check-dates.ts';
import { InvoiceCancelledEvent } from './events/invoice-cancelled.event.ts';
import { InvoiceIssuedEvent } from './events/invoice-issued.event.ts';
import { InvoiceFailedEvent } from './events/invoice-failed.event.ts';
import { InvoicePaidEvent } from './events/invoice-paid.event.ts';
import { InvoiceProcessingEvent } from './events/invoice-processing.event.ts';

export class Invoice
    implements
        Mappable<ReturnType<Invoice['toPlain']>>,
        PublishableEvents<
            | InvoiceIssuedEvent
            | InvoiceProcessingEvent
            | InvoiceCancelledEvent
            | InvoicePaidEvent
            | InvoiceFailedEvent
        >
{
    protected _id: Id;
    protected _status: InvoiceStatus;
    protected _vatRate: VatRate | null;
    protected _vatAmount: Money | null;
    protected _total: Money;
    protected _lineItems: LineItems;
    protected _issueDate: CalendarDate;
    protected _dueDate: CalendarDate;
    protected _issuer: Issuer;
    protected _recipient: Recipient;
    protected _events: (
        | InvoiceIssuedEvent
        | InvoiceProcessingEvent
        | InvoiceCancelledEvent
        | InvoicePaidEvent
        | InvoiceFailedEvent
    )[] = [];

    protected constructor(
        id: Id,
        status: InvoiceStatus,
        lineItems: LineItems,
        total: Money,
        vatRate: VatRate | null,
        vatAmount: Money | null,
        issueDate: CalendarDate,
        dueDate: CalendarDate,
        issuer: Issuer,
        recipient: Recipient
    ) {
        this._id = id;
        this._status = status;
        this._lineItems = lineItems;
        this._total = total;
        this._vatRate = vatRate;
        this._vatAmount = vatAmount;
        this._issueDate = issueDate;
        this._dueDate = dueDate;
        this._recipient = recipient;
        this._issuer = issuer;
    }

    public get id(): Id {
        return this._id;
    }
    public get status(): InvoiceStatus {
        return this._status;
    }
    public get events(): ReadonlyArray<
        | InvoiceIssuedEvent
        | InvoiceProcessingEvent
        | InvoiceCancelledEvent
        | InvoicePaidEvent
        | InvoiceFailedEvent
    > {
        return this._events;
    }
    public get total(): Money {
        return this._total;
    }
    public get vatRate(): VatRate | null {
        return this._vatRate;
    }
    public get vatAmount(): Money | null {
        return this._vatAmount;
    }
    public get lineItems(): ReadOnlyLineItems {
        return this._lineItems;
    }
    public get issueDate(): CalendarDate {
        return this._issueDate;
    }
    public get dueDate(): CalendarDate {
        return this._dueDate;
    }
    public get issuer(): Issuer {
        return this._issuer;
    }
    public get recipient(): Recipient {
        return this._recipient;
    }

    static create(options: {
        id: Id;
        status?: InvoiceStatus;
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

        const totalResult = vatRate
            ? vatRate.addTo(options.lineItems.subtotal)
            : Result.ok<DomainError, Money>(options.lineItems.subtotal);

        if (totalResult.isError()) {
            return totalResult.error();
        }

        const total = totalResult.unwrap();
        const vatAmountResult = vatRate
            ? total.subtract(options.lineItems.subtotal)
            : Result.ok<DomainError, Money | null>(null);

        if (vatAmountResult.isError()) {
            return vatAmountResult.error();
        }

        const vatAmount = vatAmountResult.unwrap();
        const status = options.status ?? InvoiceStatus.issued();
        const invoice = new Invoice(
            options.id,
            status,
            options.lineItems,
            total,
            vatRate,
            vatAmount,
            issueDate,
            dueDate,
            issuer,
            recipient
        );

        if (!options.status) {
            const event = InvoiceIssuedEvent.create(invoice.toPlain());
            invoice._events.push(event);
        }

        return Result.ok(invoice);
    }

    process() {
        if (!this._status.equals(InvoiceStatus.issued())) {
            return Result.error(
                new DomainError({
                    message: `Cannot process invoice in status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = InvoiceStatus.processing();

        this._events.push(InvoiceProcessingEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    pay() {
        if (!this._status.equals(InvoiceStatus.processing())) {
            return Result.error(
                new DomainError({
                    message: `Cannot pay invoice in status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = InvoiceStatus.paid();

        this._events.push(InvoicePaidEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    fail() {
        if (!this._status.equals(InvoiceStatus.processing())) {
            return Result.error(
                new DomainError({
                    message: `Cannot fail invoice in status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = InvoiceStatus.failed();

        this._events.push(InvoiceFailedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    cancel() {
        if (!this._status.equals(InvoiceStatus.issued())) {
            return Result.error(
                new DomainError({
                    message: `Cannot cancel invoice in status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = InvoiceStatus.cancelled();

        this._events.push(InvoiceCancelledEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            status: this._status.toString(),
            lineItems: this._lineItems.toPlain(),
            total: this._total.toPlain(),
            vatRate: this._vatRate ? this._vatRate.toPlain() : null,
            vatAmount: this._vatAmount ? this._vatAmount.toPlain() : null,
            issueDate: this._issueDate.toString(),
            dueDate: this._dueDate.toString(),
            issuer: this._issuer.toPlain(),
            recipient: this._recipient.toPlain(),
        };
    }
}
