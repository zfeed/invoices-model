import { randomUUID } from 'crypto';

export abstract class DomainEvent<T> {
    id: string;
    name: string;
    createdAt: string;
    data: T;

    constructor(event: { name: string; data: T }) {
        this.id = randomUUID();
        this.name = this.buildName();
        this.createdAt = new Date().toISOString();
        this.data = event.data;
    }

    private buildName(): string {
        const words = this.constructor.name
            .replace(/Event$/, '')
            .split(/(?=[A-Z])/)
            .map((w) => w.toLowerCase());
        const action = words.pop();
        return `${words.join('-')}.${action}`;
    }
}
