import { Equatable } from '../../../../building-blocks';

export enum INVOICE_STATUS {
    ISSUED = 'ISSUED',
    CANCELLED = 'CANCELLED',
}

export class Status implements Equatable<Status> {
    #value: INVOICE_STATUS;

    protected constructor(value: INVOICE_STATUS) {
        this.#value = value;
    }

    static issued(): Status {
        return new Status(INVOICE_STATUS.ISSUED);
    }

    static cancelled(): Status {
        return new Status(INVOICE_STATUS.CANCELLED);
    }

    toString(): string {
        return this.#value;
    }

    equals(other: Status): boolean {
        return this.#value === other.#value;
    }
}
