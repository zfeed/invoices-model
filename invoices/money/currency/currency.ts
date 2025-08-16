import { CURRENCY_CODE } from "./code";

export class Currency {
    #code: CURRENCY_CODE;

    private constructor(code: CURRENCY_CODE) {
        this.#code = code;
    }   

    public get code(): CURRENCY_CODE {
        return this.#code;
    }

    static fromISO4217(code: string) {
        if (!(code in CURRENCY_CODE)) {
            throw new Error(`Invalid currency code: ${code}`);
        }

        return new Currency(CURRENCY_CODE[code as keyof typeof CURRENCY_CODE]);
    }

    equals(currency: Currency) {
        return this.#code === currency.#code;
    }
}

