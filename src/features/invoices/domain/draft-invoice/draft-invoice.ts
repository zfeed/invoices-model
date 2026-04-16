import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../shared/index.ts';
import { PublishableEvents } from '../../../../shared/events/index.ts';
import { CalendarDate } from '../calendar-date/calendar-date.ts';
import { Id } from '../id/id.ts';
import { checkDates } from '../invoice/checks/check-dates.ts';
import { Invoice } from '../invoice/invoice.ts';
import { Issuer } from '../issuer/issuer.ts';
import { LineItem } from '../line-item/line-item.ts';
import { LineItems, ReadOnlyLineItems } from '../line-items/line-items.ts';
import { Money } from '../money/money/money.ts';
import { Recipient } from '../recipient/recipient.ts';
import { VatRate } from '../vat-rate/vat-rate.ts';
import { checkDraftInvoiceComplete } from './checks/check-draft-invoice-complete.ts';
import { checkLineItemsNotEmpty } from './checks/check-line-items-not-empty.ts';
import { DraftInvoiceArchivedEvent } from './events/draft-invoice-archived.event.ts';
import { DraftInvoiceCreatedEvent } from './events/draft-invoice-created.event.ts';
import { DraftInvoiceDraftedEvent } from './events/draft-invoice-drafted.event.ts';
import { DraftInvoiceFinishedEvent } from './events/draft-invoice-finished.event.ts';
import { DraftInvoiceUpdatedEvent } from './events/draft-invoice-updated.event.ts';
import { DraftInvoiceStatus } from '../status/draft-invoice-status.ts';

export class DraftInvoice
    implements
        Mappable<ReturnType<DraftInvoice['toPlain']>>,
        PublishableEvents<
            | DraftInvoiceCreatedEvent
            | DraftInvoiceUpdatedEvent
            | DraftInvoiceFinishedEvent
            | DraftInvoiceArchivedEvent
            | DraftInvoiceDraftedEvent
        >
{
    protected _id: Id;
    protected _status: DraftInvoiceStatus;
    protected _vatRate: VatRate | null;
    protected _vatAmount: Money | null;
    protected _total: Money | null;
    protected _lineItems: LineItems | null;
    protected _issueDate: CalendarDate | null;
    protected _dueDate: CalendarDate | null;
    protected _issuer: Issuer | null;
    protected _recipient: Recipient | null;
    protected _events: (
        | DraftInvoiceCreatedEvent
        | DraftInvoiceUpdatedEvent
        | DraftInvoiceFinishedEvent
        | DraftInvoiceArchivedEvent
        | DraftInvoiceDraftedEvent
    )[] = [];

    protected constructor(
        id: Id,
        status: DraftInvoiceStatus,
        lineItems: LineItems | null = null,
        total: Money | null = null,
        vatRate: VatRate | null = null,
        vatAmount: Money | null = null,
        issueDate: CalendarDate | null = null,
        dueDate: CalendarDate | null = null,
        issuer: Issuer | null = null,
        recipient: Recipient | null = null
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

    public get events(): ReadonlyArray<
        | DraftInvoiceCreatedEvent
        | DraftInvoiceUpdatedEvent
        | DraftInvoiceFinishedEvent
        | DraftInvoiceArchivedEvent
        | DraftInvoiceDraftedEvent
    > {
        return this._events;
    }
    public get id(): Id {
        return this._id;
    }
    public get status(): DraftInvoiceStatus {
        return this._status;
    }
    public get total(): Money | null {
        return this._total;
    }
    public get vatRate(): VatRate | null {
        return this._vatRate;
    }
    public get vatAmount(): Money | null {
        return this._vatAmount;
    }
    public get lineItems(): ReadOnlyLineItems | null {
        return this._lineItems;
    }
    public get issueDate(): CalendarDate | null {
        return this._issueDate;
    }
    public get dueDate(): CalendarDate | null {
        return this._dueDate;
    }
    public get issuer(): Issuer | null {
        return this._issuer;
    }
    public get recipient(): Recipient | null {
        return this._recipient;
    }

    protected _guardDraftStatus(): DomainError | null {
        if (!this._status.equals(DraftInvoiceStatus.draft())) {
            return new DomainError({
                message: `Cannot modify draft invoice in status ${this._status.toString()}`,
                code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION,
            });
        }
        return null;
    }

    public toInvoice(): Result<DomainError, Invoice> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        const error = checkDraftInvoiceComplete({
            total: this._total,
            vatRate: this._vatRate,
            vatAmount: this._vatAmount,
            issueDate: this._issueDate,
            dueDate: this._dueDate,
            recipient: this._recipient,
            issuer: this._issuer,
            lineItems: this._lineItems,
        });

        if (error) {
            return Result.error(error);
        }

        const result = Invoice.create({
            id: Id.create().unwrap(),
            lineItems: this._lineItems!,
            issueDate: this._issueDate!,
            vatRate: this._vatRate!,
            dueDate: this._dueDate!,
            issuer: this._issuer!,
            recipient: this._recipient!,
        });

        this._status = DraftInvoiceStatus.completed();

        this._events.push(DraftInvoiceFinishedEvent.create(this.toPlain()));

        return result;
    }

    public archive(): Result<DomainError, void> {
        if (!this._status.equals(DraftInvoiceStatus.draft())) {
            return Result.error(
                new DomainError({
                    message: `Cannot archive draft invoice in status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = DraftInvoiceStatus.archived();

        this._events.push(DraftInvoiceArchivedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public draft(): Result<DomainError, void> {
        if (!this._status.equals(DraftInvoiceStatus.archived())) {
            return Result.error(
                new DomainError({
                    message: `Cannot move to draft from status ${this._status.toString()}`,
                    code: DOMAIN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION,
                })
            );
        }

        this._status = DraftInvoiceStatus.draft();

        this._events.push(DraftInvoiceDraftedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public addLineItem(lineItem: LineItem) {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        let lineItemsResult;

        if (this._lineItems === null) {
            lineItemsResult = LineItems.create({ items: [lineItem] });
        } else {
            lineItemsResult = this._lineItems.add(lineItem);
        }

        if (lineItemsResult.isError()) {
            return lineItemsResult.error();
        }

        this._lineItems = lineItemsResult.unwrap();

        this._calculateTotal();

        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public removeLineItem(lineItem: LineItem) {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        const lineItemsResult = this._lineItems!.remove(lineItem);

        if (lineItemsResult.isError()) {
            return lineItemsResult.error();
        }

        let lineItems = lineItemsResult.unwrap();

        this._lineItems = lineItems.length === 0 ? null : lineItems;

        this._calculateTotal();

        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public applyVat(vatRate: VatRate): Result<DomainError, void> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        const error = checkLineItemsNotEmpty(this._lineItems);

        if (error) {
            return Result.error(error);
        }

        this._vatRate = vatRate;
        this._calculateTotal();

        return Result.ok(undefined);
    }

    public addIssuer(issuer: Issuer): Result<DomainError, void> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        this._issuer = issuer;
        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public addRecipient(recipient: Recipient): Result<DomainError, void> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        this._recipient = recipient;
        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public addDueDate(dueDate: CalendarDate): Result<DomainError, void> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        if (this._issueDate !== null) {
            const dateError = checkDates({
                issueDate: this._issueDate,
                dueDate,
            });
            if (dateError) {
                return Result.error(dateError);
            }
        }

        this._dueDate = dueDate;

        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public addIssueDate(issueDate: CalendarDate): Result<DomainError, void> {
        const guardError = this._guardDraftStatus();
        if (guardError) {
            return Result.error(guardError);
        }

        if (this._dueDate !== null) {
            const dateError = checkDates({
                issueDate,
                dueDate: this._dueDate,
            });
            if (dateError) {
                return Result.error(dateError);
            }
        }

        this._issueDate = issueDate;

        this._events.push(DraftInvoiceUpdatedEvent.create(this.toPlain()));

        return Result.ok(undefined);
    }

    public isValid(): boolean {
        const error = checkDraftInvoiceComplete({
            total: this._total,
            vatRate: this._vatRate,
            vatAmount: this._vatAmount,
            issueDate: this._issueDate,
            dueDate: this._dueDate,
            recipient: this._recipient,
            issuer: this._issuer,
            lineItems: this._lineItems,
        });

        if (error) {
            return false;
        }

        return true;
    }

    protected _calculateTotal(): void {
        if (this._lineItems === null) {
            this._total = null;
            return;
        }

        const subtotal = this._lineItems.subtotal;

        const total = this._vatRate
            ? this._vatRate.addTo(subtotal).unwrap()
            : subtotal;
        const vatAmount = this._vatRate
            ? total.subtract(subtotal).unwrap()
            : null;

        this._total = total;
        this._vatAmount = vatAmount;
    }

    static create(id: Id) {
        const draftInvoice = new DraftInvoice(id, DraftInvoiceStatus.draft());

        draftInvoice._events.push(
            DraftInvoiceCreatedEvent.create(draftInvoice.toPlain())
        );

        return Result.ok(draftInvoice);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            status: this._status.toString(),
            lineItems: this._lineItems?.toPlain() ?? null,
            total: this._total?.toPlain() ?? null,
            vatRate: this._vatRate?.toPlain() ?? null,
            vatAmount: this._vatAmount?.toPlain() ?? null,
            issueDate: this._issueDate?.toPlain() ?? null,
            dueDate: this._dueDate?.toPlain() ?? null,
            issuer: this._issuer?.toPlain() ?? null,
            recipient: this._recipient?.toPlain() ?? null,
        };
    }
}
