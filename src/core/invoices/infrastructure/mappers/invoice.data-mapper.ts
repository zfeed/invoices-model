import { Invoice } from '../../domain/invoice/invoice.ts';
import {
    CalendarDateDataMapper,
    CalendarDateRecord,
} from './calendar-date.data-mapper.ts';
import { IdDataMapper, IdRecord } from './id.data-mapper.ts';
import {
    InvoiceStatusDataMapper,
    InvoiceStatusRecord,
} from './invoice-status.data-mapper.ts';
import { IssuerDataMapper, IssuerRecord } from './issuer.data-mapper.ts';
import { LineItemsDataMapper } from './line-items.data-mapper.ts';

import { LineItemRecord } from './line-item.data-mapper.ts';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper.ts';
import {
    RecipientDataMapper,
    RecipientRecord,
} from './recipient.data-mapper.ts';
import { VatRateDataMapper, VatRateRecord } from './vat-rate.data-mapper.ts';

export type InvoiceRecord = {
    id: IdRecord['value'];
    status: InvoiceStatusRecord['value'];
    vat_rate: VatRateRecord['value']['value'] | null;
    vat_amount: MoneyRecord['amount']['value'] | null;
    vat_currency: MoneyRecord['currency']['code'] | null;
    subtotal_amount: MoneyRecord['amount']['value'];
    subtotal_currency: MoneyRecord['currency']['code'];
    total_amount: MoneyRecord['amount']['value'];
    total_currency: MoneyRecord['currency']['code'];
    issue_date: CalendarDateRecord['value'];
    due_date: CalendarDateRecord['value'];
    issuer_type: IssuerRecord['issuer_type'];
    issuer_name: IssuerRecord['issuer_name'];
    issuer_address: IssuerRecord['issuer_address'];
    issuer_tax_id: IssuerRecord['issuer_tax_id'];
    issuer_email: IssuerRecord['issuer_email'];
    recipient_type: RecipientRecord['recipient_type'];
    recipient_name: RecipientRecord['recipient_name'];
    recipient_address: RecipientRecord['recipient_address'];
    recipient_tax_id: RecipientRecord['recipient_tax_id'];
    recipient_email: RecipientRecord['recipient_email'];
    recipient_tax_residence_country: RecipientRecord['recipient_tax_residence_country'];
    line_items: LineItemRecord[];
    invoice_paypal_billings: {
        invoice_id: string;
        email: string;
    };
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
            IdDataMapper.fromRecord({ value: record.id }),
            InvoiceStatusDataMapper.fromRecord({
                value: record.status,
            }),
            LineItemsDataMapper.fromRecord({
                items: [],
                subtotal: {
                    amount: {
                        value: record.subtotal_amount,
                    },
                    currency: {
                        code: record.subtotal_currency,
                    },
                },
            }),
            MoneyDataMapper.fromRecord({
                amount: {
                    value: record.total_amount,
                },
                currency: {
                    code: record.total_currency,
                },
            }),
            record.vat_rate
                ? VatRateDataMapper.fromRecord({
                      value: {
                          value: record.vat_rate,
                      },
                  })
                : null,
            record.vat_amount && record.vat_currency
                ? MoneyDataMapper.fromRecord({
                      amount: {
                          value: record.vat_amount,
                      },
                      currency: {
                          code: record.vat_currency,
                      },
                  })
                : null,
            CalendarDateDataMapper.fromRecord({
                value: record.issue_date,
            }),
            CalendarDateDataMapper.fromRecord({
                value: record.due_date,
            }),
            IssuerDataMapper.fromRecord({
                issuer_type: record.issuer_type,
                issuer_name: record.issuer_name,
                issuer_address: record.issuer_address,
                issuer_tax_id: record.issuer_tax_id,
                issuer_email: record.issuer_email,
            }),
            RecipientDataMapper.fromRecord({
                recipient_type: record.recipient_type,
                recipient_name: record.recipient_name,
                recipient_address: record.recipient_address,
                recipient_tax_id: record.recipient_tax_id,
                recipient_email: record.recipient_email,
                recipient_tax_residence_country:
                    record.recipient_tax_residence_country,
                billing: record.invoice_paypal_billings,
            })
        );
    }

    toRecord(): InvoiceRecord {
        const invoice_id = IdDataMapper.from(this._id).toRecord().value;
        const vatAmountRecord = this._vatAmount
            ? MoneyDataMapper.from(this._vatAmount).toRecord()
            : null;

        const lineItemsRecord = LineItemsDataMapper.from(
            this._lineItems
        ).toRecord({
            invoice_id,
        });

        const totalAmountRecord = MoneyDataMapper.from(this._total).toRecord();
        const issuerRecord = IssuerDataMapper.from(this._issuer).toRecord();
        const recipientRecord = RecipientDataMapper.from(
            this._recipient
        ).toRecord({ invoice_id });

        return {
            id: IdDataMapper.from(this._id).toRecord().value,
            status: InvoiceStatusDataMapper.from(this._status).toRecord().value,
            vat_rate: this._vatRate
                ? VatRateDataMapper.from(this._vatRate).toRecord().value.value
                : null,
            vat_amount: vatAmountRecord?.amount.value ?? null,
            vat_currency: vatAmountRecord?.currency.code ?? null,
            subtotal_amount: lineItemsRecord.subtotal.amount.value,
            subtotal_currency: lineItemsRecord.subtotal.currency.code,
            total_amount: totalAmountRecord.amount.value,
            total_currency: totalAmountRecord.currency.code,
            issue_date: CalendarDateDataMapper.from(this._issueDate).toRecord()
                .value,
            due_date: CalendarDateDataMapper.from(this._dueDate).toRecord()
                .value,
            issuer_type: issuerRecord.issuer_type,
            issuer_name: issuerRecord.issuer_name,
            issuer_address: issuerRecord.issuer_address,
            issuer_tax_id: issuerRecord.issuer_tax_id,
            issuer_email: issuerRecord.issuer_name,
            recipient_type: recipientRecord.recipient_type,
            recipient_name: recipientRecord.recipient_name,
            recipient_address: recipientRecord.recipient_address,
            recipient_tax_id: recipientRecord.recipient_tax_id,
            recipient_email: recipientRecord.recipient_email,
            recipient_tax_residence_country:
                recipientRecord.recipient_tax_residence_country,
            line_items: lineItemsRecord.items,
            invoice_paypal_billings: recipientRecord.billing,
        };
    }
}
