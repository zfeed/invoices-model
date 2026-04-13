import {
    DomainEventClass,
    SerializedDomainEvent,
} from '../../shared/events/domain-event';
import { type Duration } from '../../lib/dayjs';
import { sql } from 'kysely';
import type { Kysely, ControlledTransaction } from '../../../database/kysely';
import {
    trace,
    SpanKind,
    SpanStatusCode,
    ROOT_CONTEXT,
} from '@opentelemetry/api';

const tracer = trace.getTracer('event-outbox');

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
    constructor(private readonly kysely: Kysely) {}

    private db(options?: Options): Kysely | ControlledTransaction {
        return options?.transaction ?? this.kysely;
    }

    static create<T extends EventClass>(kysely: Kysely): EventOutboxStorage<T> {
        return new EventOutboxStorage(kysely);
    }

    async insert(
        events: {
            id: string;
            name: string;
            payload: Payload;
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
                    payload: JSON.stringify(event.payload),
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
        return tracer.startActiveSpan(
            'event_outbox poll',
            {
                kind: SpanKind.CONSUMER,
                attributes: {
                    'outbox.batch_size': limit,
                    'outbox.max_delivery_attempts': options.maxDeliveryAttempts,
                    'outbox.timeout_seconds': options.timeout.asSeconds(),
                },
            },
            ROOT_CONTEXT,
            async (span) => {
                try {
                    const db = this.db(options);
                    const { maxDeliveryAttempts, timeout } = options;
                    const rows = await db
                        .updateTable('event_outbox')
                        .set({
                            delivery_attempts: (eb) =>
                                eb('delivery_attempts', '+', 1),
                            last_attempted_at: new Date().toISOString(),
                        })
                        .where(
                            'id',
                            'in',
                            db
                                .selectFrom('event_outbox')
                                .select('id')
                                .where('delivered_at', 'is', null)
                                .where(
                                    'delivery_attempts',
                                    '<',
                                    maxDeliveryAttempts
                                )
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

                    const results = rows.map((row) => ({
                        eventName: row.event_name,
                        payload: row.payload as Payload,
                    }));

                    span.setAttribute('outbox.events_polled', results.length);

                    return results;
                } catch (error) {
                    span.recordException(error as Error);
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: (error as Error).message,
                    });
                    throw error;
                } finally {
                    span.end();
                }
            }
        );
    }
}
