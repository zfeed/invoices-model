import { DomainEvent, DomainEventClass } from '../events/domain-event';
import { PublishableEvents } from '../events/event-publisher.interface';

export interface DomainEvents {
    publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void>;

    subscribeToEvent<T extends DomainEvent<any>>(
        eventClass: DomainEventClass<T>,
        handler: (event: T) => Promise<void>
    ): Promise<void>;
}
