import { randomUUID } from 'crypto';

export abstract class DomainEvent<T> {
    id: string;
    name: string;
    createdAt: string;
    data: T;

    constructor(event: { name: string; data: T }) {
        this.id = randomUUID();
        this.name = event.name;
        this.createdAt = new Date().toISOString();
        this.data = event.data;
    }
}
