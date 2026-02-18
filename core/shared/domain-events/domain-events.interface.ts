import { DomainEvent } from '../../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../../building-blocks/events/event-publisher.interface';

export interface DomainEvents {
    publishEvents(...objects: PublishableEvents<DomainEvent<unknown>>[]): void;

    subscribeToEvent<T extends DomainEvent<D>, D>(
        eventClass: new (...args: any[]) => T,
        handler: (event: T) => void | Promise<void>
    ): void;
}
