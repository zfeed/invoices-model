import { Decimal } from 'decimal.js';

export class Unit {
    private value: Decimal;

    protected constructor(value: string) {
        this.value = new Decimal(value);
    }

    static fromString(value: string) {
        return new Unit(value);
    }

    multiplyBy(unit: Unit) {
        return new Unit(this.value.mul(unit.value).toString());
    }

    add(unit: Unit) {
        return new Unit(this.value.add(unit.value).toString());
    }

    equals(unit: Unit) {
        return this.value.equals(unit.value);
    }
}
