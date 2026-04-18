import { Session } from '../../../core/bulding-blocks/unit-of-work/unit-of-work.ts';
import { PersistentManager } from '../../infrastructure/persistent-manager/pg-persistent-manager.ts';
import { DomainEventsBus } from '../../../core/bulding-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';
import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox.ts';
import type { Kysely } from '../../../../database/kysely.ts';

export const createSession = (
    kysely: Kysely,
    domainEventsBus: DomainEventsBus,
    eventOutboxStorage: EventOutboxStorage
): Session =>
    new Session(
        new PersistentManager(kysely, domainEventsBus, eventOutboxStorage)
    );
