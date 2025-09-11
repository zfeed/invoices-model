import { Currency } from "../../currency/currency";
import { DomainError, DOMAIN_ERROR_CODE } from "../../../../building-blocks";

export  function assertEqualCurrencies(
    currencyA: Currency,
    currencyB: Currency
): DomainError | null {
    if (!currencyA.equals(currencyB)) {
        return new DomainError({
            message: `Currencies are not equal: ${currencyA} and ${currencyB}`,
            code: DOMAIN_ERROR_CODE.MONEY_CURRENCIES_NOT_EQUAL,
        });
    }

    return null;
}