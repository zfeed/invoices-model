import {
    KNOWN_ERROR_CODE,
    AppKnownError,
    Result,
} from '../../../../shared/index.ts';
import { INVOICE_STATUS, Status } from './status.ts';

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

    static fromString(value: string): Result<AppKnownError, InvoiceStatus> {
        return Status.parseEnum(
            INVOICE_STATUS,
            value,
            KNOWN_ERROR_CODE.INVOICE_INVALID_STATUS
        ).map((s) => new InvoiceStatus(s));
    }
}
