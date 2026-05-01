import { DraftInvoice } from '../../domain/draft-invoice/draft-invoice.ts';
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
import { LineItemRecord } from './line-item.data-mapper.ts';
import { LineItemsDataMapper } from './line-items.data-mapper.ts';
import { MoneyDataMapper, MoneyRecord } from './money.data-mapper.ts';
import {
    RecipientDataMapper,
    RecipientRecord,
} from './recipient.data-mapper.ts';
import { VatRateDataMapper, VatRateRecord } from './vat-rate.data-mapper.ts';

type DraftLineItemRecord = Omit<LineItemRecord, 'invoice_id'> & {
    draft_invoice_id: IdRecord['value'];
};

type DraftPaypalBillingRecord = {
    draft_invoice_id: IdRecord['value'];
    email: RecipientRecord['recipient_email'];
};

export type DraftInvoiceRecord = {
    id: IdRecord['value'];
    status: DraftInvoiceStatusRecord['value'];
    vat_rate: VatRateRecord['value']['value'] | null;
    vat_amount: MoneyRecord['amount']['value'] | null;
    vat_currency: MoneyRecord['currency']['code'] | null;
    subtotal_amount: MoneyRecord['amount']['value'] | null;
    subtotal_currency: MoneyRecord['currency']['code'] | null;
    total_amount: MoneyRecord['amount']['value'] | null;
    total_currency: MoneyRecord['currency']['code'] | null;
    issue_date: CalendarDateRecord['value'] | null;
    due_date: CalendarDateRecord['value'] | null;
    issuer_type: IssuerRecord['issuer_type'] | null;
    issuer_name: IssuerRecord['issuer_name'] | null;
    issuer_address: IssuerRecord['issuer_address'] | null;
    issuer_tax_id: IssuerRecord['issuer_tax_id'] | null;
    issuer_email: IssuerRecord['issuer_email'] | null;
    recipient_type: RecipientRecord['recipient_type'] | null;
    recipient_name: RecipientRecord['recipient_name'] | null;
    recipient_address: RecipientRecord['recipient_address'] | null;
    recipient_tax_id: RecipientRecord['recipient_tax_id'] | null;
    recipient_email: RecipientRecord['recipient_email'] | null;
    recipient_tax_residence_country:
        | RecipientRecord['recipient_tax_residence_country']
        | null;
    line_items: DraftLineItemRecord[];
    draft_invoice_paypal_billings: DraftPaypalBillingRecord | null;
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
            IdDataMapper.fromRecord({ value: record.id }),
            DraftInvoiceStatusDataMapper.fromRecord({
                value: record.status,
            }),
            record.subtotal_amount !== null && record.subtotal_currency !== null
                ? LineItemsDataMapper.fromRecord({
                      items: record.line_items.map((item) => ({
                          id: item.id,
                          invoice_id: record.id,
                          description: item.description,
                          price_amount: item.price_amount,
                          price_currency: item.price_currency,
                          quantity: item.quantity,
                          total_amount: item.total_amount,
                          total_currency: item.total_currency,
                      })),
                      subtotal: {
                          amount: {
                              value: record.subtotal_amount,
                          },
                          currency: {
                              code: record.subtotal_currency,
                          },
                      },
                  })
                : null,
            record.total_amount !== null && record.total_currency !== null
                ? MoneyDataMapper.fromRecord({
                      amount: {
                          value: record.total_amount,
                      },
                      currency: {
                          code: record.total_currency,
                      },
                  })
                : null,
            record.vat_rate !== null
                ? VatRateDataMapper.fromRecord({
                      value: {
                          value: record.vat_rate,
                      },
                  })
                : null,
            record.vat_amount !== null && record.vat_currency !== null
                ? MoneyDataMapper.fromRecord({
                      amount: {
                          value: record.vat_amount,
                      },
                      currency: {
                          code: record.vat_currency,
                      },
                  })
                : null,
            record.issue_date !== null
                ? CalendarDateDataMapper.fromRecord({
                      value: record.issue_date,
                  })
                : null,
            record.due_date !== null
                ? CalendarDateDataMapper.fromRecord({
                      value: record.due_date,
                  })
                : null,
            record.issuer_type !== null &&
                record.issuer_name !== null &&
                record.issuer_address !== null &&
                record.issuer_tax_id !== null &&
                record.issuer_email !== null
                ? IssuerDataMapper.fromRecord({
                      issuer_type: record.issuer_type,
                      issuer_name: record.issuer_name,
                      issuer_address: record.issuer_address,
                      issuer_tax_id: record.issuer_tax_id,
                      issuer_email: record.issuer_email,
                  })
                : null,
            record.recipient_type !== null &&
                record.recipient_name !== null &&
                record.recipient_address !== null &&
                record.recipient_tax_id !== null &&
                record.recipient_email !== null &&
                record.recipient_tax_residence_country !== null &&
                record.draft_invoice_paypal_billings !== null
                ? RecipientDataMapper.fromRecord({
                      recipient_type: record.recipient_type,
                      recipient_name: record.recipient_name,
                      recipient_address: record.recipient_address,
                      recipient_tax_id: record.recipient_tax_id,
                      recipient_email: record.recipient_email,
                      recipient_tax_residence_country:
                          record.recipient_tax_residence_country,
                      billing: {
                          invoice_id:
                              record.draft_invoice_paypal_billings
                                  .draft_invoice_id,
                          email: record.draft_invoice_paypal_billings.email,
                      },
                  })
                : null
        );
    }

    toRecord(): DraftInvoiceRecord {
        const draft_invoice_id = IdDataMapper.from(this._id).toRecord().value;
        const vatAmountRecord = this._vatAmount
            ? MoneyDataMapper.from(this._vatAmount).toRecord()
            : null;
        const lineItemsRecord = this._lineItems
            ? LineItemsDataMapper.from(this._lineItems).toRecord({
                  invoice_id: draft_invoice_id,
              })
            : null;
        const totalRecord = this._total
            ? MoneyDataMapper.from(this._total).toRecord()
            : null;
        const issuerRecord = this._issuer
            ? IssuerDataMapper.from(this._issuer).toRecord()
            : null;
        const recipientRecord = this._recipient
            ? RecipientDataMapper.from(this._recipient).toRecord({
                  invoice_id: draft_invoice_id,
              })
            : null;

        return {
            id: draft_invoice_id,
            status: DraftInvoiceStatusDataMapper.from(this._status).toRecord()
                .value,
            vat_rate: this._vatRate
                ? VatRateDataMapper.from(this._vatRate).toRecord().value.value
                : null,
            vat_amount: vatAmountRecord?.amount.value ?? null,
            vat_currency: vatAmountRecord?.currency.code ?? null,
            subtotal_amount: lineItemsRecord?.subtotal.amount.value ?? null,
            subtotal_currency: lineItemsRecord?.subtotal.currency.code ?? null,
            total_amount: totalRecord?.amount.value ?? null,
            total_currency: totalRecord?.currency.code ?? null,
            issue_date: this._issueDate
                ? CalendarDateDataMapper.from(this._issueDate).toRecord().value
                : null,
            due_date: this._dueDate
                ? CalendarDateDataMapper.from(this._dueDate).toRecord().value
                : null,
            issuer_type: issuerRecord?.issuer_type ?? null,
            issuer_name: issuerRecord?.issuer_name ?? null,
            issuer_address: issuerRecord?.issuer_address ?? null,
            issuer_tax_id: issuerRecord?.issuer_tax_id ?? null,
            issuer_email: issuerRecord?.issuer_email ?? null,
            recipient_type: recipientRecord?.recipient_type ?? null,
            recipient_name: recipientRecord?.recipient_name ?? null,
            recipient_address: recipientRecord?.recipient_address ?? null,
            recipient_tax_id: recipientRecord?.recipient_tax_id ?? null,
            recipient_email: recipientRecord?.recipient_email ?? null,
            recipient_tax_residence_country:
                recipientRecord?.recipient_tax_residence_country ?? null,
            line_items:
                lineItemsRecord?.items.map((item) => ({
                    id: item.id,
                    draft_invoice_id,
                    description: item.description,
                    price_amount: item.price_amount,
                    price_currency: item.price_currency,
                    quantity: item.quantity,
                    total_amount: item.total_amount,
                    total_currency: item.total_currency,
                })) ?? [],
            draft_invoice_paypal_billings: recipientRecord?.billing
                ? {
                      draft_invoice_id,
                      email: recipientRecord.billing.email,
                  }
                : null,
        };
    }
}
