import { assertCurrencyCode } from './asserts/assert-currency-code';

export class Currency {
    #code: string;

    constructor(code: string){
        assertCurrencyCode(code);
    
        this.#code = code;
    }

    equals(other: Currency): boolean {
        return this.#code === other.#code;
    }
}