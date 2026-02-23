import { applySpec, prop } from 'ramda';
import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { amountIsInteger, amountIsNonNegative } from './checks/check-amount';
import { currencyIsISO4217 } from './checks/check-currency-code';

export type Money = {
    amount: string;
    currency: string;
};

type MoneyInput = {
    amount: string;
    currency: string;
};

const buildMoney = applySpec<Money>({
    amount: prop('amount'),
    currency: prop('currency'),
});

export type PlainMoney = {
    amount: string;
    currency: string;
};

export const moneyToPlain = applySpec<PlainMoney>({
    amount: prop('amount'),
    currency: prop('currency'),
});

export const createMoney = (
    amount: string,
    currency: string
): Result<DomainError, Money> =>
    Result.ok<DomainError, MoneyInput>({ amount, currency })
        .flatMap(amountIsInteger)
        .flatMap(amountIsNonNegative)
        .flatMap(currencyIsISO4217)
        .map(buildMoney);
