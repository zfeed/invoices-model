import { DomainEvent } from '../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../building-blocks/events/event-publisher.interface';
import { DomainEvents } from '../../core/shared/domain-events/domain-events.interface';

type EventHandler<T = any> = (event: T) => Promise<void>;

export class InMemoryDomainEvents implements DomainEvents {
    private handlers = new Map<Function, EventHandler[]>();

    async publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void> {
        for (const object of objects) {
            for (const event of object.events) {
                const handlers = this.handlers.get(event.constructor) ?? [];
                for (const handler of handlers) {
                    await handler(event);
                }
            }
        }
    }

    async subscribeToEvent<T extends DomainEvent<D>, D>(
        eventClass: new (...args: any[]) => T,
        handler: (event: T) => Promise<void>
    ): Promise<void> {
        const handlers = this.handlers.get(eventClass) ?? [];
        handlers.push(handler);
        this.handlers.set(eventClass, handlers);
    }
}
