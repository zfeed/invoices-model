export class Container {
    private readonly instances = new Map<unknown, unknown>();

    register<T>(token: unknown, instance: T): void {
        this.instances.set(token, instance);
    }

    getOrThrow<T>(token: unknown): T {
        const instance = this.instances.get(token);
        if (instance === undefined) {
            throw new Error(`Dependency not registered: ${token}`);
        }
        return instance as T;
    }
}
