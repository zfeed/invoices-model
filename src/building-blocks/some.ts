enum SOME_TYPE {
    NONE,
    SOME,
}

export class Some<T> {
    static of<T>(value: T): Some<T> {
        return new Some<T>(SOME_TYPE.SOME, value);
    }

    static none<T = never>(): Some<T> {
        return new Some<T>(SOME_TYPE.NONE, undefined as never);
    }

    private constructor(
        private readonly type: SOME_TYPE,
        private readonly value: T
    ) {}

    map<U>(fn: (value: T) => U): Some<U> {
        if (this.isSome()) {
            return Some.of(fn(this.value));
        }
        return Some.none();
    }

    flatMap<U>(fn: (value: T) => Some<U>): Some<U> {
        if (this.isSome()) {
            return fn(this.value);
        }
        return Some.none();
    }

    getOrElse(fallback: T): T {
        if (this.isSome()) {
            return this.value;
        }
        return fallback;
    }

    fold<U>(onNone: () => U, onSome: (value: T) => U): U {
        if (this.isSome()) {
            return onSome(this.value);
        }
        return onNone();
    }

    isSome(): boolean {
        return this.type === SOME_TYPE.SOME;
    }

    isNone(): boolean {
        return this.type === SOME_TYPE.NONE;
    }
}
