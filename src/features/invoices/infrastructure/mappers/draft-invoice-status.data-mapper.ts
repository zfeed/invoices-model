import { DraftInvoiceStatus } from '../../domain/status/draft-invoice-status.ts';
import { DRAFT_INVOICE_STATUS } from '../../domain/status/status.ts';

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
