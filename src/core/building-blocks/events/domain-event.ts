import { v7 as uuidv7 } from 'uuid';
import { organizationContext } from '../../../lib/organization-context/organization-context.ts';

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
    organizationId: string;
    createdAt: string;
    data: T;
};

export type DomainEventClass<E extends DomainEvent<any> = DomainEvent<any>> = {
    readonly prototype: E;
    readonly name: string;
    create(data: E['data']): E;
    deserialize(serialized: SerializedDomainEvent<E['data']>): E;
    matches(eventName: string): boolean;
    eventName(): string;
};

export abstract class DomainEvent<T> {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
    data: T;

    protected constructor(fields: SerializedDomainEvent<T>) {
        this.id = fields.id;
        this.name = fields.name;
        this.organizationId = fields.organizationId;
        this.createdAt = fields.createdAt;
        this.data = fields.data;
    }

    static create<E extends DomainEvent<any>>(
        this: { prototype: E; name: string },
        data: E['data']
    ): E {
        const EventCtor = this as unknown as new (
            fields: SerializedDomainEvent<E['data']>
        ) => E;

        return new EventCtor({
            id: uuidv7(),
            name: deriveName(this.name),
            organizationId: organizationContext.getOrganizationId(),
            createdAt: new Date().toISOString(),
            data,
        });
    }

    static eventName() {
        return deriveName(this.name);
    }

    serialize(): SerializedDomainEvent<T> {
        return {
            id: this.id,
            name: this.name,
            organizationId: this.organizationId,
            createdAt: this.createdAt,
            data: this.data,
        };
    }

    static deserialize<E extends DomainEvent<any>>(
        this: { prototype: E },
        serialized: SerializedDomainEvent<E['data']>
    ): E {
        const EventCtor = this as unknown as new (
            fields: SerializedDomainEvent<E['data']>
        ) => E;

        return new EventCtor(serialized);
    }

    static matches(eventName: string): boolean {
        return deriveName(this.name) === eventName;
    }
}
