import { DomainEvent, DomainEventClass } from '../events/domain-event.ts';
import { PublishableEvents } from '../events/event-publisher.interface.ts';

export type EventHandler<T = unknown> = (event: T) => Promise<void>;

export interface DomainEventsBus {
    start(): Promise<void>;
    stop(): Promise<void>;

    publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void>;

    subscribeToEvent<T extends DomainEvent<any>>(
        eventClass: DomainEventClass<T>,
        handler: EventHandler<T>
    ): Promise<void>;
}
