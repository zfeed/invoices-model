import dayjs from 'dayjs';
import { Invoice } from '../../domain/invoice/invoice';
import { INVOICE_STATUS } from '../../domain/status/status';
import { ISSUER_TYPE } from '../../domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../domain/recipient/recipient';
import type { InvoiceStorage } from '../invoice-storage';

export type InvoiceRow = Awaited<ReturnType<InvoiceStorage['select']>>[number];
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

    static fromRows(rows: InvoiceRow[]): InvoiceDataMapper {
        const row = rows[0];
        const lineItemRows = rows.filter(
            (r) => r.invoice_line_item_id !== null
        );

        const record: InvoiceRecord = {
            id: { value: row.id },
            status: { value: row.status as INVOICE_STATUS },
            lineItems: {
                items: lineItemRows.map((r) => ({
                    id: { value: r.invoice_line_item_id! },
                    description: {
                        value: r.invoice_line_item_description!,
                    },
                    price: {
                        amount: {
                            value: r.invoice_line_item_price_amount!,
                        },
                        currency: {
                            code: r.invoice_line_item_price_currency!,
                        },
                    },
                    quantity: {
                        value: {
                            value: r.invoice_line_item_quantity!,
                        },
                    },
                    total: {
                        amount: {
                            value: r.invoice_line_item_total_amount!,
                        },
                        currency: {
                            code: r.invoice_line_item_total_currency!,
                        },
                    },
                })),
                subtotal: {
                    amount: { value: row.subtotal_amount },
                    currency: { code: row.subtotal_currency },
                },
            },
            total: {
                amount: { value: row.total_amount },
                currency: { code: row.total_currency },
            },
            vatRate:
                row.vat_rate !== null
                    ? { value: { value: row.vat_rate } }
                    : null,
            vatAmount:
                row.vat_amount !== null
                    ? {
                          amount: { value: row.vat_amount },
                          currency: { code: row.vat_currency! },
                      }
                    : null,
            issueDate: {
                value: dayjs(row.issue_date).format('YYYY-MM-DD'),
            },
            dueDate: { value: dayjs(row.due_date).format('YYYY-MM-DD') },
            issuer: {
                type: row.issuer_type as ISSUER_TYPE,
                name: row.issuer_name,
                address: row.issuer_address,
                taxId: row.issuer_tax_id,
                email: { value: row.issuer_email },
            },
            recipient: {
                type: row.recipient_type as RECIPIENT_TYPE,
                name: row.recipient_name,
                address: row.recipient_address,
                taxId: row.recipient_tax_id,
                email: { value: row.recipient_email },
                taxResidenceCountry: {
                    code: row.recipient_tax_residence_country,
                },
                billing: {
                    type: 'PAYPAL' as const,
                    data: {
                        email: {
                            value: row.invoice_paypal_billing_email!,
                        },
                    },
                },
            },
        };

        return InvoiceDataMapper.fromRecord(record);
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
