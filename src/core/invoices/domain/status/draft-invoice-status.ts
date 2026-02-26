import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Result,
} from '../../../../building-blocks';
import { DRAFT_INVOICE_STATUS, Status } from './status';

export class DraftInvoiceStatus extends Status<DRAFT_INVOICE_STATUS> {
    static draft(): DraftInvoiceStatus {
        return new DraftInvoiceStatus(DRAFT_INVOICE_STATUS.DRAFT);
    }

    static completed(): DraftInvoiceStatus {
        return new DraftInvoiceStatus(DRAFT_INVOICE_STATUS.COMPLETED);
    }

    static archived(): DraftInvoiceStatus {
        return new DraftInvoiceStatus(DRAFT_INVOICE_STATUS.ARCHIVED);
    }

    static fromString(value: string): Result<DomainError, DraftInvoiceStatus> {
        return Status.parseEnum(
            DRAFT_INVOICE_STATUS,
            value,
            DOMAIN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS
        ).map((s) => new DraftInvoiceStatus(s));
    }
}
