type Constructor<T> = abstract new (...args: never[]) => T;

export class Container {
    private readonly instances = new Map<Constructor<unknown>, unknown>();

    register<T>(token: Constructor<T>, instance: T): void {
        this.instances.set(token, instance);
    }

    getOrThrow<T>(token: Constructor<T>): T {
        const instance = this.instances.get(token);
        if (instance === undefined) {
            throw new Error(`Dependency not registered: ${token.name}`);
        }
        return instance as T;
    }
}
