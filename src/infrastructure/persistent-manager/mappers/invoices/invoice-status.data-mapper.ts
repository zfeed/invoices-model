import { InvoiceStatus } from '../../../../core/invoices/domain/status/invoice-status';
import { INVOICE_STATUS } from '../../../../core/invoices/domain/status/status';

export type InvoiceStatusRecord = {
    value: INVOICE_STATUS;
};

export class InvoiceStatusDataMapper extends InvoiceStatus {
    static from(status: InvoiceStatus): InvoiceStatusDataMapper {
        return Object.setPrototypeOf(
            status,
            InvoiceStatusDataMapper.prototype
        ) as InvoiceStatusDataMapper;
    }

    static fromRecord(record: InvoiceStatusRecord): InvoiceStatusDataMapper {
        return new InvoiceStatusDataMapper(record.value);
    }

    toRecord(): InvoiceStatusRecord {
        return {
            value: this._value,
        };
    }
}
