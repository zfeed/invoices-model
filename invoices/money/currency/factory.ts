import { BHD } from "./codes/bhd";
import { JPY } from "./codes/jpy";
import { USD } from "./codes/usd";
    
export class CurrencyFactory {
    static fromISO4217(iso4217: string) {
        if (iso4217 === "USD") {
            return new USD();
        }
    
        if (iso4217 === "JPY") {
            return new JPY();
        }
        if (iso4217 === "BHD") {
            return new BHD();
        }

        throw new Error(`Invalid currency code: ${iso4217}`);
    }
}

