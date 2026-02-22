import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { orderIsNonNegative } from './checks/check-order-non-negative';

export type Order = number;

export const createOrder = (value: number): Result<DomainError, Order> =>
    Result.ok<DomainError, number>(value).flatMap(orderIsNonNegative);
