import { DomainEvent } from './events/domain-event';
import { PublishableEvents } from './events/event-publisher.interface';

export class DomainEventsBus {
    subscribers: Map<string, ((event: DomainEvent<any>) => void)[]> = new Map();

    publishEvents<T extends DomainEvent<unknown>>(
        ...objects: PublishableEvents<T>[]
    ) {
        objects
            .flatMap((object) => object.events)
            .forEach((event) => {
                const handlers = this.subscribers.get(event.name);

                if (!handlers) {
                    return;
                }

                handlers.forEach((handler) => handler(event));
            });
    }

    subscribeToEvent<T extends DomainEvent<D>, D>(
        eventName: string,
        handler: (event: T) => void
    ) {
        this.subscribeToEvent(eventName, handler);
    }
}
