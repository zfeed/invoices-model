import { DOMAIN_ERROR_CODE, DomainError, Equatable, Result } from '../../../../building-blocks';

export enum INVOICE_STATUS {
    ISSUED = 'ISSUED',
    PROCESSING = 'PROCESSING',
    CANCELLED = 'CANCELLED',
    PAID = 'PAID',
    FAILED = 'FAILED',
}

export enum DRAFT_INVOICE_STATUS {
    DRAFT = 'DRAFT',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

export class Status<T extends string> implements Equatable<Status<T>> {
    #value: T;

    protected constructor(value: T) {
        this.#value = value;
    }

    protected static parseEnum<E extends Record<string, string>>(
        enumObj: E,
        value: string,
        errorCode: DOMAIN_ERROR_CODE
    ): Result<DomainError, E[keyof E]> {
        const status = Object.values(enumObj).find((s) => s === value);

        if (!status) {
            return Result.error(
                new DomainError({
                    message: `Invalid status: ${value}`,
                    code: errorCode,
                })
            );
        }

        return Result.ok(status as E[keyof E]);
    }

    toString(): string {
        return this.#value;
    }

    equals(other: Status<T>): boolean {
        return this.#value === other.#value;
    }
}

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
        return Status.parseEnum(DRAFT_INVOICE_STATUS, value, DOMAIN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS)
            .map((s) => new DraftInvoiceStatus(s));
    }
}
