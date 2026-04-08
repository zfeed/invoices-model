import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox';
import { kysely } from '../../../database/kysely';

export const createEventOutboxStorage = (): EventOutboxStorage =>
    EventOutboxStorage.create(kysely);
