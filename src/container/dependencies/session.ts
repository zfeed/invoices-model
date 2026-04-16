import { Session } from '../../shared/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { DomainEventsBus } from '../../shared/domain-events/domain-events-bus.interface.ts';
import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox.ts';
import { kysely } from '../../../database/kysely.ts';

export const createSession = (
    domainEventsBus: DomainEventsBus,
    eventOutboxStorage: EventOutboxStorage
): Session =>
    new Session(
        new PersistentManager(kysely, domainEventsBus, eventOutboxStorage)
    );
