export class IO<T> {
    static of<T>(value: T): IO<T> {
        return new IO(() => Promise.resolve(value));
    }

    static from<T>(effect: () => Promise<T>): IO<T> {
        return new IO(effect);
    }

    private constructor(private readonly effect: () => Promise<T>) {}

    run(): Promise<T> {
        return this.effect();
    }

    map<U>(fn: (value: T) => U): IO<U> {
        return new IO(() => this.effect().then(fn));
    }

    flatMap<U>(fn: (value: T) => IO<U>): IO<U> {
        return new IO(() => this.effect().then((value) => fn(value).run()));
    }
}
