import { DomainEvent } from './events/domain-event';
import { PublishableEvents } from './events/event-publisher.interface';

export class DomainEventsBus {
    subscribers: Map<string, ((event: DomainEvent<any>) => Promise<void>)[]> =
        new Map();

    async publishEvents<T extends DomainEvent<unknown>>(
        ...objects: PublishableEvents<T>[]
    ): Promise<void> {
        for (const object of objects) {
            for (const event of object.events) {
                const handlers = this.subscribers.get(event.name);

                if (!handlers) {
                    continue;
                }

                for (const handler of handlers) {
                    await handler(event);
                }
            }
        }
    }

    async subscribeToEvent<T extends DomainEvent<D>, D>(
        eventName: string,
        handler: (event: T) => Promise<void>
    ): Promise<void> {
        this.subscribeToEvent(eventName, handler);
    }
}
