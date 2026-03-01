import { DraftInvoiceStatus } from '../../../core/invoices/domain/status/draft-invoice-status';
import { DRAFT_INVOICE_STATUS } from '../../../core/invoices/domain/status/status';

export type DraftInvoiceStatusRecord = {
    value: DRAFT_INVOICE_STATUS;
};

export class DraftInvoiceStatusDataMapper extends DraftInvoiceStatus {
    static from(status: DraftInvoiceStatus): DraftInvoiceStatusDataMapper {
        return Object.setPrototypeOf(
            status,
            DraftInvoiceStatusDataMapper.prototype
        ) as DraftInvoiceStatusDataMapper;
    }

    static fromRecord(
        record: DraftInvoiceStatusRecord
    ): DraftInvoiceStatusDataMapper {
        return new DraftInvoiceStatusDataMapper(record.value);
    }

    toRecord(): DraftInvoiceStatusRecord {
        return {
            value: this._value,
        };
    }
}
