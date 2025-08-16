import { Numeric } from "./invoices/numeric/numeric";
import { ROUNDING, DECIMAL_PLACES } from "./invoices/numeric/rounding";

function main() {
    const numA = Numeric.fromString(
        "100.3445",
        ROUNDING.UP,
        DECIMAL_PLACES.TWO
    );
    const numB = Numeric.fromString("2", ROUNDING.UP, DECIMAL_PLACES.TWO);
    const result = numA.multiplyBy(numB);


}

main();
