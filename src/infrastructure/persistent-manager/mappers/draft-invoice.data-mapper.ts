import { DraftInvoice } from '../../../core/invoices/domain/draft-invoice/draft-invoice';
import {
    CalendarDateDataMapper,
    CalendarDateRecord,
} from './calendar-date.data-mapper';
import {
    DraftInvoiceStatusDataMapper,
    DraftInvoiceStatusRecord,
} from './draft-invoice-status.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import { IssuerDataMapper, IssuerRecord } from './issuer.data-mapper';
import { LineItemsDataMapper, LineItemsRecord } from './line-items.data-mapper';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';
import { RecipientDataMapper, RecipientRecord } from './recipient.data-mapper';
import { VatRateDataMapper, VatRateRecord } from './vat-rate.data-mapper';

export type DraftInvoiceRecord = {
    id: IdRecord;
    status: DraftInvoiceStatusRecord;
    lineItems: LineItemsRecord | null;
    total: MoneyRecord | null;
    vatRate: VatRateRecord | null;
    vatAmount: MoneyRecord | null;
    issueDate: CalendarDateRecord | null;
    dueDate: CalendarDateRecord | null;
    issuer: IssuerRecord | null;
    recipient: RecipientRecord | null;
};

export class DraftInvoiceDataMapper extends DraftInvoice {
    static from(draftInvoice: DraftInvoice): DraftInvoiceDataMapper {
        return Object.setPrototypeOf(
            draftInvoice,
            DraftInvoiceDataMapper.prototype
        ) as DraftInvoiceDataMapper;
    }

    static fromRecord(record: DraftInvoiceRecord): DraftInvoiceDataMapper {
        return new DraftInvoiceDataMapper(
            IdDataMapper.fromRecord(record.id),
            DraftInvoiceStatusDataMapper.fromRecord(record.status),
            record.lineItems
                ? LineItemsDataMapper.fromRecord(record.lineItems)
                : null,
            record.total ? MoneyDataMapper.fromRecord(record.total) : null,
            record.vatRate
                ? VatRateDataMapper.fromRecord(record.vatRate)
                : null,
            record.vatAmount
                ? MoneyDataMapper.fromRecord(record.vatAmount)
                : null,
            record.issueDate
                ? CalendarDateDataMapper.fromRecord(record.issueDate)
                : null,
            record.dueDate
                ? CalendarDateDataMapper.fromRecord(record.dueDate)
                : null,
            record.issuer ? IssuerDataMapper.fromRecord(record.issuer) : null,
            record.recipient
                ? RecipientDataMapper.fromRecord(record.recipient)
                : null
        );
    }

    toRecord(): DraftInvoiceRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            status: DraftInvoiceStatusDataMapper.from(this._status).toRecord(),
            lineItems: this._lineItems
                ? LineItemsDataMapper.from(this._lineItems).toRecord()
                : null,
            total: this._total
                ? MoneyDataMapper.from(this._total).toRecord()
                : null,
            vatRate: this._vatRate
                ? VatRateDataMapper.from(this._vatRate).toRecord()
                : null,
            vatAmount: this._vatAmount
                ? MoneyDataMapper.from(this._vatAmount).toRecord()
                : null,
            issueDate: this._issueDate
                ? CalendarDateDataMapper.from(this._issueDate).toRecord()
                : null,
            dueDate: this._dueDate
                ? CalendarDateDataMapper.from(this._dueDate).toRecord()
                : null,
            issuer: this._issuer
                ? IssuerDataMapper.from(this._issuer).toRecord()
                : null,
            recipient: this._recipient
                ? RecipientDataMapper.from(this._recipient).toRecord()
                : null,
        };
    }
}
