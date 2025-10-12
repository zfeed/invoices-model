import { DomainEvent } from './domain-event';

export interface PublishableEvents<T extends DomainEvent<any>> {
    events: ReadonlyArray<T>;
}
