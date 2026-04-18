import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox.ts';
import type { Kysely } from '../../../../database/kysely.ts';

export const createEventOutboxStorage = (kysely: Kysely): EventOutboxStorage =>
    EventOutboxStorage.create(kysely);
