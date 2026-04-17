import {
    KNOWN_ERROR_CODE,
    AppKnownError,
    Equatable,
    Result,
} from '../../../../shared/index.ts';

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
    protected _value: T;

    protected constructor(value: T) {
        this._value = value;
    }

    protected static parseEnum<E extends Record<string, string>>(
        enumObj: E,
        value: string,
        errorCode: KNOWN_ERROR_CODE
    ): Result<AppKnownError, E[keyof E]> {
        const status = Object.values(enumObj).find((s) => s === value);

        if (!status) {
            return Result.error(
                new AppKnownError({
                    message: `Invalid status: ${value}`,
                    code: errorCode,
                })
            );
        }

        return Result.ok(status as E[keyof E]);
    }

    toString(): string {
        return this._value;
    }

    equals(other: Status<T>): boolean {
        return this._value === other._value;
    }
}
