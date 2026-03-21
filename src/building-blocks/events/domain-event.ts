import { v7 as uuidv7 } from 'uuid';

function deriveName(className: string): string {
    const words = className
        .replace(/Event$/, '')
        .split(/(?=[A-Z])/)
        .map((w) => w.toLowerCase());
    const action = words.pop();
    return `${words.join('-')}.${action}`;
}

export type SerializedDomainEvent<T = unknown> = {
    id: string;
    name: string;
    createdAt: string;
    data: T;
};

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

    serialize(): SerializedDomainEvent<T> {
        return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            data: this.data,
        };
    }

    static deserialize<E extends DomainEvent<D>, D>(
        this: new (data: D) => E,
        serialized: SerializedDomainEvent<D>
    ): E {
        const event = new this(serialized.data);
        event.id = serialized.id;
        event.name = serialized.name;
        event.createdAt = serialized.createdAt;
        return event;
    }

    static matches(eventName: string): boolean {
        return deriveName(this.name) === eventName;
    }

    private buildName(): string {
        return deriveName(this.constructor.name);
    }
}
