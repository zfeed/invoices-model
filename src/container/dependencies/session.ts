import { Session } from '../../shared/unit-of-work/unit-of-work';
import { PersistentManager } from '../../infrastructure/persistent-manager/pg-persistent-manager';
import { DomainEventsBus } from '../../shared/domain-events/domain-events-bus.interface';
import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox';
import { kysely } from '../../../database/kysely';

export const createSession = (
    domainEventsBus: DomainEventsBus,
    eventOutboxStorage: EventOutboxStorage
): Session =>
    new Session(
        new PersistentManager(kysely, domainEventsBus, eventOutboxStorage)
    );
