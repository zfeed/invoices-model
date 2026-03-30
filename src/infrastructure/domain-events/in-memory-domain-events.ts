import {
    DomainEvent,
    DomainEventClass,
} from '../../shared/events/domain-event';
import { PublishableEvents } from '../../shared/events/event-publisher.interface';
import { DomainEvents } from '../../shared/domain-events/domain-events.interface';

type EventHandler<T = any> = (event: T) => Promise<void>;

export class InMemoryDomainEvents implements DomainEvents {
    private handlers = new Map<DomainEventClass, EventHandler[]>();

    async publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void> {
        for (const object of objects) {
            for (const event of object.events) {
                const handlers =
                    this.handlers.get(
                        event.constructor as unknown as DomainEventClass
                    ) ?? [];
                for (const handler of handlers) {
                    await handler(event);
                }
            }
        }
    }

    async subscribeToEvent<T extends DomainEvent<any>>(
        eventClass: DomainEventClass<T>,
        handler: (event: T) => Promise<void>
    ): Promise<void> {
        const handlers = this.handlers.get(eventClass) ?? [];
        handlers.push(handler);
        this.handlers.set(eventClass, handlers);
    }
}
