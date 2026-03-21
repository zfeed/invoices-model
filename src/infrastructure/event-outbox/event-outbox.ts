import { DomainEvent } from '../../building-blocks/events/domain-event';
import { type Duration } from '../../lib/dayjs';
import { sql } from 'kysely';
import {
    kysely as defaultKysely,
    type Kysely,
    type ControlledTransaction,
} from '../../../database/kysely';

export class EventOutboxStorage {
    private readonly db: Kysely | ControlledTransaction;

    private constructor(
        timeout: Duration,
        maxDeliveryAttempts: number,
        tx?: ControlledTransaction
    ) {
        this.db = tx ?? defaultKysely;
        this.timeout = timeout;
        this.maxDeliveryAttempts = maxDeliveryAttempts;
    }

    private timeout: Duration;
    private maxDeliveryAttempts: number;

    static create(
        timeout: Duration,
        maxDeliveryAttempts: number,
        tx?: ControlledTransaction
    ): EventOutboxStorage {
        return new EventOutboxStorage(timeout, maxDeliveryAttempts, tx);
    }

    async insert(events: DomainEvent<unknown>[]) {
        if (events.length === 0) {
            return;
        }

        await this.db
            .insertInto('event_outbox')
            .values(
                events.map((event) => ({
                    event_name: event.name,
                    payload: JSON.stringify(event.serialize()),
                }))
            )
            .execute();
    }

    async delivered(id: string) {
        await this.db
            .updateTable('event_outbox')
            .set({
                delivered_at: new Date().toISOString(),
            })
            .where('id', '=', id)
            .execute();
    }

    async poll(limit: number) {
        return this.db
            .updateTable('event_outbox')
            .set({
                delivery_attempts: (eb) => eb('delivery_attempts', '+', 1),
                last_attempted_at: new Date().toISOString(),
            })
            .where(
                'id',
                'in',
                this.db
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
    }
}
