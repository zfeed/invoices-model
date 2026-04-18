import { DomainEvent } from './domain-event.ts';

export interface PublishableEvents<T extends DomainEvent<any>> {
    events: ReadonlyArray<T>;
}
