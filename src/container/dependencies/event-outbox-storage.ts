import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox.ts';
import { kysely } from '../../../database/kysely.ts';

export const createEventOutboxStorage = (): EventOutboxStorage =>
    EventOutboxStorage.create(kysely);
