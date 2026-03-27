import { DomainEvent } from '../events/domain-event';
import { PublishableEvents } from '../events/event-publisher.interface';

export interface DomainEvents {
    publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void>;

    subscribeToEvent<T extends DomainEvent<D>, D>(
        eventClass: new (...args: any[]) => T,
        handler: (event: T) => Promise<void>
    ): Promise<void>;
}
