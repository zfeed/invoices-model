import { DOMAIN_ERROR_CODE, DomainError, Result } from '../../../../building-blocks';
import { INVOICE_STATUS, Status } from './status';

export class InvoiceStatus extends Status<INVOICE_STATUS> {
    static issued(): InvoiceStatus {
        return new InvoiceStatus(INVOICE_STATUS.ISSUED);
    }

    static processing(): InvoiceStatus {
        return new InvoiceStatus(INVOICE_STATUS.PROCESSING);
    }

    static cancelled(): InvoiceStatus {
        return new InvoiceStatus(INVOICE_STATUS.CANCELLED);
    }

    static paid(): InvoiceStatus {
        return new InvoiceStatus(INVOICE_STATUS.PAID);
    }

    static failed(): InvoiceStatus {
        return new InvoiceStatus(INVOICE_STATUS.FAILED);
    }

    static fromString(value: string): Result<DomainError, InvoiceStatus> {
        return Status.parseEnum(INVOICE_STATUS, value, DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS)
            .map((s) => new InvoiceStatus(s));
    }
}
