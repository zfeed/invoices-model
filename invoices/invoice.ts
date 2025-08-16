import { Money } from './money/money';
import { VatRate } from './vat-rate';

export class Invoice {
    #vatRate: VatRate;
    #total: Money;

    public get total(): Money {
        return this.#total;
    }

    public get vatRate(): VatRate {
        return this.#vatRate;
    }

    private constructor(total: Money, vatRate: VatRate) {
        this.#total = total;
        this.#vatRate = vatRate;
    }

    static create(amount: string, currency: string, vatRate?: string) {
        const money = Money.create(amount, currency);

        return new Invoice(money, VatRate.fromPercent(vatRate || '0'));
    }


    applyVatRate(vatRate: VatRate) {
        const money = vatRate.applyTo(this.total);

        this.#total = money;
        this.#vatRate = vatRate;
    }
}
