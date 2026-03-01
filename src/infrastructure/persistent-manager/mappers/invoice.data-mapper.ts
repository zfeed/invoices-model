import { Invoice } from '../../../core/invoices/domain/invoice/invoice';
import {
    CalendarDateDataMapper,
    CalendarDateRecord,
} from './calendar-date.data-mapper';
import { IdDataMapper, IdRecord } from './id.data-mapper';
import {
    InvoiceStatusDataMapper,
    InvoiceStatusRecord,
} from './invoice-status.data-mapper';
import { IssuerDataMapper, IssuerRecord } from './issuer.data-mapper';
import { LineItemsDataMapper, LineItemsRecord } from './line-items.data-mapper';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper';
import { RecipientDataMapper, RecipientRecord } from './recipient.data-mapper';
import { VatRateDataMapper, VatRateRecord } from './vat-rate.data-mapper';

export type InvoiceRecord = {
    id: IdRecord;
    status: InvoiceStatusRecord;
    lineItems: LineItemsRecord;
    total: MoneyRecord;
    vatRate: VatRateRecord | null;
    vatAmount: MoneyRecord | null;
    issueDate: CalendarDateRecord;
    dueDate: CalendarDateRecord;
    issuer: IssuerRecord;
    recipient: RecipientRecord;
};

export class InvoiceDataMapper extends Invoice {
    static from(invoice: Invoice): InvoiceDataMapper {
        return Object.setPrototypeOf(
            invoice,
            InvoiceDataMapper.prototype
        ) as InvoiceDataMapper;
    }

    static fromRecord(record: InvoiceRecord): InvoiceDataMapper {
        return new InvoiceDataMapper(
            IdDataMapper.fromRecord(record.id),
            InvoiceStatusDataMapper.fromRecord(record.status),
            LineItemsDataMapper.fromRecord(record.lineItems),
            MoneyDataMapper.fromRecord(record.total),
            record.vatRate
                ? VatRateDataMapper.fromRecord(record.vatRate)
                : null,
            record.vatAmount
                ? MoneyDataMapper.fromRecord(record.vatAmount)
                : null,
            CalendarDateDataMapper.fromRecord(record.issueDate),
            CalendarDateDataMapper.fromRecord(record.dueDate),
            IssuerDataMapper.fromRecord(record.issuer),
            RecipientDataMapper.fromRecord(record.recipient)
        );
    }

    toRecord(): InvoiceRecord {
        return {
            id: IdDataMapper.from(this._id).toRecord(),
            status: InvoiceStatusDataMapper.from(this._status).toRecord(),
            lineItems: LineItemsDataMapper.from(this._lineItems).toRecord(),
            total: MoneyDataMapper.from(this._total).toRecord(),
            vatRate: this._vatRate
                ? VatRateDataMapper.from(this._vatRate).toRecord()
                : null,
            vatAmount: this._vatAmount
                ? MoneyDataMapper.from(this._vatAmount).toRecord()
                : null,
            issueDate: CalendarDateDataMapper.from(this._issueDate).toRecord(),
            dueDate: CalendarDateDataMapper.from(this._dueDate).toRecord(),
            issuer: IssuerDataMapper.from(this._issuer).toRecord(),
            recipient: RecipientDataMapper.from(this._recipient).toRecord(),
        };
    }
}
