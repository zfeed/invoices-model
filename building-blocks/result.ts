
import { DomainError } from './domain-error';

export enum RESULT_TYPE {
  ERROR,
  OK
}


export class Result<L, R, T extends RESULT_TYPE = RESULT_TYPE> {
  static ok<L = never, T = never>(value: T): Result<L, T, RESULT_TYPE.OK> {
    return new Result<L, T, RESULT_TYPE.OK>(RESULT_TYPE.OK, value);
  }

  static error<T extends DomainError = never, R = never>(value: T): Result<T, R, RESULT_TYPE.ERROR> {
    return new Result<T, R, RESULT_TYPE.ERROR>(RESULT_TYPE.ERROR, value);
  }

  private constructor(private readonly type: T, public readonly value: T extends RESULT_TYPE.ERROR ? L : R) {}

  isError(): this is Result<L, R, RESULT_TYPE.ERROR> {
    return this.type === RESULT_TYPE.ERROR;
  }

  isOk(): this is Result<L, R, RESULT_TYPE.OK> {
    return this.type === RESULT_TYPE.OK;
  }

  unwrap(): R {
    if (this.isOk()) {
        return this.value;
    }

    throw this.value;
  }
}
