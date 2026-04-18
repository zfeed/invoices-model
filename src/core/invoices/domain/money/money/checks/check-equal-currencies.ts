import {
    KNOWN_ERROR_CODE,
    AppKnownError,
} from '../../../../../../shared/index.ts';
import { Currency } from '../../currency/currency.ts';

export function checkEqualCurrencies(
    currencyA: Currency,
    currencyB: Currency
): AppKnownError | null {
    if (!currencyA.equals(currencyB)) {
        return new AppKnownError({
            message: `Currencies are not equal: ${currencyA} and ${currencyB}`,
            code: KNOWN_ERROR_CODE.MONEY_CURRENCIES_NOT_EQUAL,
        });
    }

    return null;
}
