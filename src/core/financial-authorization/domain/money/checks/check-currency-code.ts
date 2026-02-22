import { ifElse } from 'ramda';
import { isISO4217 } from 'validator';
import { DOMAIN_ERROR_CODE } from '../../../../../building-blocks/errors/domain/domain-codes';
import { DomainError } from '../../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../../building-blocks/result';

type MoneyInput = {
    amount: string;
    currency: string;
};

const currencyInvalid = (data: MoneyInput) => !isISO4217(data.currency);

const createCurrencyInvalidError = (data: MoneyInput) =>
    Result.error(
        new DomainError({
            message: `Expected a valid ISO 4217 currency code, but received: ${data.currency}`,
            code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217,
        })
    );

export function currencyIsISO4217(data: MoneyInput) {
    return Result.ok<DomainError, MoneyInput>(data).flatMap(
        ifElse(currencyInvalid, createCurrencyInvalidError, Result.ok)
    );
}
