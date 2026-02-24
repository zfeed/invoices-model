import { v7 as uuidv7 } from 'uuid';

export abstract class DomainEvent<T> {
    id: string;
    name: string;
    createdAt: string;
    data: T;

    constructor(data: T) {
        this.id = uuidv7();
        this.name = this.buildName();
        this.createdAt = new Date().toISOString();
        this.data = data;
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
