import { InvoiceStatus } from '../../domain/status/invoice-status.ts';
import { INVOICE_STATUS } from '../../domain/status/status.ts';

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
