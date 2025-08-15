import { Unit } from './unit';

export class Amount extends Unit {
    private constructor(value: string) {
        super(value);
    }

    static fromString(value: string) {
        return new Amount(String(value));
    }
}
