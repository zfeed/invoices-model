import { assertCurrencyCode } from './asserts/assert-currency-code';
import { from, left, right } from '@sweet-monads/either';

export class Currency {
    #code: string;

    private constructor(code: string){
        this.#code = code;
    }

    static create(code: string){
        const error = assertCurrencyCode(code);
    
        if (error) {
            return left(error);
        }
        return right(new Currency(code));
    }

    equals(other: Currency): boolean {
        return this.#code === other.#code;
    }
}

