import {
    DomainEvent,
    SerializedDomainEvent,
} from '../../building-blocks/events/domain-event';
import { type Duration } from '../../lib/dayjs';
import { sql } from 'kysely';
import {
    kysely as defaultKysely,
    type Kysely,
    type ControlledTransaction,
} from '../../../database/kysely';

type EventClass = (new (...args: never[]) => DomainEvent<unknown>) & {
    matches(eventName: string): boolean;
    deserialize(
        serialized: SerializedDomainEvent<unknown>
    ): DomainEvent<unknown>;
};

type Options = {
    transaction?: ControlledTransaction;
};

export class EventOutboxStorage<T extends EventClass = EventClass> {
    private readonly registry: ReadonlyArray<T>;

    private constructor(
        registry: ReadonlyArray<T>,
        timeout: Duration,
        maxDeliveryAttempts: number
    ) {
        this.registry = registry;
        this.timeout = timeout;
        this.maxDeliveryAttempts = maxDeliveryAttempts;
    }

    private timeout: Duration;
    private maxDeliveryAttempts: number;

    private db(options?: Options): Kysely | ControlledTransaction {
        return options?.transaction ?? defaultKysely;
    }

    static create<T extends EventClass>(
        registry: ReadonlyArray<T>,
        timeout: Duration,
        maxDeliveryAttempts: number
    ): EventOutboxStorage<T> {
        return new EventOutboxStorage(registry, timeout, maxDeliveryAttempts);
    }

    async insert(events: InstanceType<T>[], options?: Options) {
        if (events.length === 0) {
            return;
        }

        await this.db(options)
            .insertInto('event_outbox')
            .values(
                events.map((event) => ({
                    id: event.id,
                    event_name: event.name,
                    payload: JSON.stringify(event.serialize()),
                }))
            )
            .execute();
    }

    async delivered(event: InstanceType<T>, options?: Options) {
        await this.db(options)
            .updateTable('event_outbox')
            .set({
                delivered_at: new Date().toISOString(),
            })
            .where('id', '=', event.id)
            .execute();
    }

    async poll(limit: number, options?: Options): Promise<InstanceType<T>[]> {
        const db = this.db(options);
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
                    .where('delivery_attempts', '<', this.maxDeliveryAttempts)
                    .where((eb) =>
                        eb.or([
                            eb('last_attempted_at', 'is', null),
                            eb(
                                'last_attempted_at',
                                '<',
                                sql<Date>`now() - ${sql.lit(this.timeout.asSeconds())} * interval '1 second'`
                            ),
                        ])
                    )
                    .orderBy('created_at', 'asc')
                    .limit(limit)
                    .forUpdate()
                    .skipLocked()
            )
            .returningAll()
            .execute();

        return rows.map((row) => {
            const EventCtor = this.registry.find((e) =>
                e.matches(row.event_name)
            );

            if (!EventCtor) {
                throw new Error(
                    `No event class registered for event name: ${row.event_name}`
                );
            }

            return EventCtor.deserialize(
                row.payload as SerializedDomainEvent<unknown>
            ) as InstanceType<T>;
        });
    }
}
