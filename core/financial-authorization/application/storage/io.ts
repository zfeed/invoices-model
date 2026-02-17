import { Id } from '../../domain/id/id';

interface Either<L, R> {
    map<U>(fn: (value: R) => U): Either<L, U>;
    flatMap<U>(fn: (value: R) => Either<L, U>): Either<L, U>;
}

interface Some<T> {
    map<U>(fn: (value: T) => U): Some<U>;
    flatMap<U>(fn: (value: T) => Some<U>): Some<U>;
    unwrap(): T | null;
}

export interface IO<T> {
    findById(id: Id): IO<Some<T>>;
    save(type: T): IO<Either<Error, T>>;
    update(entity: T): IO<Either<Error, T>>;
    map<U>(fn: (value: T) => U): IO<U>;
    flatMap<U>(fn: (value: T) => IO<U>): IO<U>;
}
