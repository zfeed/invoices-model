import {
    DomainEvent,
    DomainEventClass,
} from '../../../core/building-blocks/events/domain-event.ts';
import { PublishableEvents } from '../../../core/building-blocks/events/event-publisher.interface.ts';
import { DomainEventsBus } from '../../../core/building-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';

type EventHandler<T = any> = (event: T) => Promise<void>;

export class InMemoryDomainEventsBus implements DomainEventsBus {
    private handlers = new Map<DomainEventClass, EventHandler[]>();

    async start(): Promise<void> {}

    async stop(): Promise<void> {}

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
