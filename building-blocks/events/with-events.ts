import { DomainEvent } from './domain-event';
import { PublishableEvents } from './event-publisher.interface';

export type WithEvents<T, E extends DomainEvent<any> = DomainEvent<any>> = T &
    PublishableEvents<E>;

export const withEvents = <T, E extends DomainEvent<any>>(
    value: T,
    events: E[]
): WithEvents<T, E> => ({
    ...value,
    events,
});
