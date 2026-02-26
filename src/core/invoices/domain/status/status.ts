import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Equatable,
    Result,
} from '../../../../building-blocks';

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
