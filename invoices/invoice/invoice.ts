import { Money } from '../money/money';
import { Vat } from '../vat/vat';

export class Invoice {
    #vat: Vat;
    #total: Money;

    public get total(): Money {
        return this.#total;
    }

    public get vat(): Vat {
        return this.#vat;
    }

    private constructor(total: Money, vat: Vat) {
        this.#total = total;
        this.#vat = vat;
    }

    static create(amount: string, currency: string, vat?: string) {
        const money = Money.create(amount, currency);

        return new Invoice(money, Vat.fromPercent(vat || '0'));
    }


    applyVat(vat: Vat) {
        const money = vat.applyTo(this.total);

        this.#total = money;
        this.#vat = vat;
    }
}
