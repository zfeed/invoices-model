import {
    DomainEventClass,
    SerializedDomainEvent,
} from '../../shared/events/domain-event';
import { type Duration } from '../../lib/dayjs';
import { sql } from 'kysely';
import {
    kysely as defaultKysely,
    type Kysely,
    type ControlledTransaction,
} from '../../../database/kysely';

type EventClass = DomainEventClass;
type EventInstance<T extends EventClass> =
    T extends DomainEventClass<infer E> ? E : never;

type Options = {
    transaction?: ControlledTransaction;
};

type PollOptions = Options & {
    maxDeliveryAttempts: number;
    timeout: Duration;
    eventNames: string[];
};

type Payload = Record<string, unknown>;

export class EventOutboxStorage<T extends EventClass = EventClass> {
    private db(options?: Options): Kysely | ControlledTransaction {
        return options?.transaction ?? defaultKysely;
    }

    static create<T extends EventClass>(): EventOutboxStorage<T> {
        return new EventOutboxStorage();
    }

    async insert(
        events: {
            id: string;
            name: string;
            event: Payload;
        }[],
        options?: Options
    ) {
        if (events.length === 0) {
            return;
        }

        await this.db(options)
            .insertInto('event_outbox')
            .values(
                events.map((event) => ({
                    id: event.id,
                    event_name: event.name,
                    payload: JSON.stringify(event),
                }))
            )
            .execute();
    }

    async delivered(eventId: string, options?: Options) {
        await this.db(options)
            .updateTable('event_outbox')
            .set({
                delivered_at: new Date().toISOString(),
            })
            .where('id', '=', eventId)
            .execute();
    }

    async poll(limit: number, options: PollOptions) {
        const db = this.db(options);
        const { maxDeliveryAttempts, timeout } = options;
        const rows = await db
            .updateTable('event_outbox')
            .set({
                delivery_attempts: (eb) => eb('delivery_attempts', '+', 1),
                last_attempted_at: new Date().toISOString(),
            })
            .where(
                'id',
                'in',
                db
                    .selectFrom('event_outbox')
                    .select('id')
                    .where('delivered_at', 'is', null)
                    .where('delivery_attempts', '<', maxDeliveryAttempts)
                    .where((eb) =>
                        eb.or([
                            eb('last_attempted_at', 'is', null),
                            eb(
                                'last_attempted_at',
                                '<',
                                sql<Date>`now() - ${sql.lit(timeout.asSeconds())} * interval '1 second'`
                            ),
                        ])
                    )
                    .where('event_name', 'in', options.eventNames)
                    .orderBy('created_at', 'asc')
                    .limit(limit)
                    .forUpdate()
                    .skipLocked()
            )
            .returningAll()
            .execute();

        return rows.map((row) => row.payload as Payload);
    }
}
