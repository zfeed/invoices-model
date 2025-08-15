import { Money } from './money';
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
        const vat = this.total.amount.value.multiplyBy(vatRate.value);
        const total = this.total.amount.value.add(vat);
        const money = Money.fromNumeric(total, this.total.currency);

        this.#total = money;
        this.#vatRate = vatRate;
    }
}
