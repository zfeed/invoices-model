import { DOMAIN_ERROR_CODE, DomainError, Equatable, Result } from '../../../../building-blocks';

export enum INVOICE_STATUS {
    ISSUED = 'ISSUED',
    PROCESSING = 'PROCESSING',
    CANCELLED = 'CANCELLED',
    PAID = 'PAID',
    FAILED = 'FAILED',
}

export class Status implements Equatable<Status> {
    #value: INVOICE_STATUS;

    protected constructor(value: INVOICE_STATUS) {
        this.#value = value;
    }

    static issued(): Status {
        return new Status(INVOICE_STATUS.ISSUED);
    }

    static processing(): Status {
        return new Status(INVOICE_STATUS.PROCESSING);
    }

    static cancelled(): Status {
        return new Status(INVOICE_STATUS.CANCELLED);
    }

    static paid(): Status {
        return new Status(INVOICE_STATUS.PAID);
    }

    static failed(): Status {
        return new Status(INVOICE_STATUS.FAILED);
    }

    static fromString(value: string): Result<DomainError, Status> {
        const status = Object.values(INVOICE_STATUS).find((s) => s === value);

        if (!status) {
            return Result.error(
                new DomainError({
                    message: `Invalid invoice status: ${value}`,
                    code: DOMAIN_ERROR_CODE.INVOICE_INVALID_STATUS,
                })
            );
        }

        return Result.ok(new Status(status));
    }

    toString(): string {
        return this.#value;
    }

    equals(other: Status): boolean {
        return this.#value === other.#value;
    }
}
