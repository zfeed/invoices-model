import dayjs from 'dayjs';
import { DraftInvoice } from '../../domain/draft-invoice/draft-invoice.ts';
import { DRAFT_INVOICE_STATUS } from '../../domain/status/status.ts';
import { ISSUER_TYPE } from '../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../domain/recipient/recipient.ts';
import type { DraftInvoiceRow } from '../draft-invoice.persister.ts';
export type { DraftInvoiceRow };
import {
    CalendarDateDataMapper,
    CalendarDateRecord,
} from './calendar-date.data-mapper.ts';
import {
    DraftInvoiceStatusDataMapper,
    DraftInvoiceStatusRecord,
} from './draft-invoice-status.data-mapper.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';
import { IssuerDataMapper, IssuerRecord } from './issuer.data-mapper.ts';
import {
    LineItemsDataMapper,
    LineItemsRecord,
} from './line-items.data-mapper.ts';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper.ts';
import {
    RecipientDataMapper,
    RecipientRecord,
} from './recipient.data-mapper.ts';
import { VatRateDataMapper, VatRateRecord } from './vat-rate.data-mapper.ts';

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

    static fromRows(rows: DraftInvoiceRow[]): DraftInvoiceDataMapper {
        const row = rows[0];
        const lineItemRows = rows.filter(
            (r) => r.draft_invoice_line_item_id !== null
        );

        const record: DraftInvoiceRecord = {
            id: { value: row.id },
            status: { value: row.status as DRAFT_INVOICE_STATUS },
            lineItems:
                lineItemRows.length > 0
                    ? {
                          items: lineItemRows.map((r) => ({
                              id: { value: r.draft_invoice_line_item_id! },
                              description: {
                                  value: r.draft_invoice_line_item_description!,
                              },
                              price: {
                                  amount: {
                                      value: r.draft_invoice_line_item_price_amount!,
                                  },
                                  currency: {
                                      code: r.draft_invoice_line_item_price_currency!,
                                  },
                              },
                              quantity: {
                                  value: {
                                      value: r.draft_invoice_line_item_quantity!,
                                  },
                              },
                              total: {
                                  amount: {
                                      value: r.draft_invoice_line_item_total_amount!,
                                  },
                                  currency: {
                                      code: r.draft_invoice_line_item_total_currency!,
                                  },
                              },
                          })),
                          subtotal: {
                              amount: { value: row.subtotal_amount! },
                              currency: { code: row.subtotal_currency! },
                          },
                      }
                    : null,
            total:
                row.total_amount !== null
                    ? {
                          amount: { value: row.total_amount },
                          currency: { code: row.total_currency! },
                      }
                    : null,
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
            issueDate:
                row.issue_date !== null
                    ? {
                          value: dayjs(row.issue_date).format('YYYY-MM-DD'),
                      }
                    : null,
            dueDate:
                row.due_date !== null
                    ? { value: dayjs(row.due_date).format('YYYY-MM-DD') }
                    : null,
            issuer:
                row.issuer_type !== null
                    ? {
                          type: row.issuer_type as ISSUER_TYPE,
                          name: row.issuer_name!,
                          address: row.issuer_address!,
                          taxId: row.issuer_tax_id!,
                          email: { value: row.issuer_email! },
                      }
                    : null,
            recipient:
                row.recipient_type !== null
                    ? {
                          type: row.recipient_type as RECIPIENT_TYPE,
                          name: row.recipient_name!,
                          address: row.recipient_address!,
                          taxId: row.recipient_tax_id!,
                          email: { value: row.recipient_email! },
                          taxResidenceCountry: {
                              code: row.recipient_tax_residence_country!,
                          },
                          billing: {
                              type: 'PAYPAL' as const,
                              data: {
                                  email: {
                                      value: row.draft_invoice_paypal_billing_email!,
                                  },
                              },
                          },
                      }
                    : null,
        };

        return DraftInvoiceDataMapper.fromRecord(record);
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
