import { Unit } from './unit';

export class VatRate extends Unit {
    private constructor(value: string) {
        super(value);
    }

    static fromPercent(value: string) {
        return new VatRate(String(Number(value) / 100));
    }
}
