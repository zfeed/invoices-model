import { Money } from './money';
import { VatRate } from './vat-rate';

export class Invoice {
    private constructor(public total: Money, public vatRate: VatRate) {}

    static create(amount: string, currency: string, vatRate?: string) {
        const money = Money.create(amount, currency);

        return new Invoice(money, VatRate.fromPercent(vatRate || '0'));
    }

    applyVatRate(vatRate: VatRate) {
        const vatRateAmount = this.total.amount.multiplyBy(vatRate);
        const totalAmount = this.total.amount.add(vatRateAmount);
        this.total = Money.fromAmount(totalAmount, this.total.currency);
        this.vatRate = vatRate;
    }
}
