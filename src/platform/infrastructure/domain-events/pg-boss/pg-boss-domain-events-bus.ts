import { PgBoss, fromKysely, Job, WorkOptions } from 'pg-boss';
import {
    DomainEvent,
    DomainEventClass,
    SerializedDomainEvent,
} from '../../../../core/building-blocks/events/domain-event.ts';
import {
    EventHandler,
    DomainEventsBus,
} from '../../../../core/building-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';
import { PublishableEvents } from '../../../../core/building-blocks/events/event-publisher.interface.ts';
import { Logger } from '../../../../core/building-blocks/logger/logger.ts';
import { ControlledTransaction } from '../../../../../database/kysely.ts';

const isPublishableEvents = (
    value: unknown
): value is PublishableEvents<DomainEvent<unknown>> =>
    typeof value === 'object' && value !== null && 'events' in value;

export class PgBossDomainEventsBus implements DomainEventsBus {
    private readonly handlers = new Map<DomainEventClass, EventHandler[]>();
    private readonly boss: PgBoss;
    private readonly queuePrefix?: string;
    private readonly logger: Logger;
    private readonly pollingIntervalSeconds?: number;
    private readonly ensuredQueues = new Set<string>();

    constructor(config: {
        connectionString: string;
        queuePrefix?: string;
        logger: Logger;
        schema?: string;
        pollingIntervalSeconds?: number;
    }) {
        this.boss = new PgBoss({
          connectionString: config.connectionString,
            schema: config.schema,
        });
        this.queuePrefix = config.queuePrefix;
        this.logger = config.logger;
        this.pollingIntervalSeconds = config.pollingIntervalSeconds;
    }

    async start(): Promise<void> {
        this.boss.on('error', (error: unknown) =>
            this.logger.error('pg-boss error', { error })
        );

        await this.boss.start();

        const workOptions: WorkOptions =
            this.pollingIntervalSeconds !== undefined
                ? { pollingIntervalSeconds: this.pollingIntervalSeconds }
                : {};

        for (const eventClass of this.handlers.keys()) {
            const queue = this.applyQueuePrefix(eventClass.eventName());
            await this.ensureQueue(queue);

            await this.boss.work<SerializedDomainEvent>(
                queue,
                workOptions,
                async (jobs: Job<SerializedDomainEvent>[]) => {
                    const handlers = this.handlers.get(eventClass) ?? [];
                    for (const job of jobs) {
                        const event = eventClass.deserialize(job.data);
                        await Promise.all(
                            handlers.map((handler) => handler(event))
                        );
                    }
                }
            );
        }
    }

    async stop(): Promise<void> {
        await this.boss.stop();
    }

    publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void>;
    publishEvents(
        transaction: ControlledTransaction,
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void>;
    async publishEvents(
        ...args: (
            | ControlledTransaction
            | PublishableEvents<DomainEvent<unknown>>
        )[]
    ): Promise<void> {
        const first = args[0];
        const transaction =
            first !== undefined && !isPublishableEvents(first)
                ? first
                : undefined;
        const objects = args.filter(isPublishableEvents);

        const events = objects.flatMap((object) => object.events);

        if (events.length === 0) {
            return;
        }

        const db = transaction ? fromKysely(transaction) : undefined;

        await Promise.all(
            events.map(async (event) => {
                const queue = this.applyQueuePrefix(event.name);
                await this.ensureQueue(queue);
                await this.boss.send(
                    queue,
                    event.serialize(),
                    db ? { db } : {}
                );
            })
        );
    }

    async subscribeToEvent<T extends DomainEvent<unknown>>(
        eventClass: DomainEventClass<T>,
        handler: (event: T) => Promise<void>
    ): Promise<void> {
        const handlers = this.handlers.get(eventClass) ?? [];
        handlers.push(handler as EventHandler);
        this.handlers.set(eventClass, handlers);
    }

    private async ensureQueue(queue: string): Promise<void> {
        if (this.ensuredQueues.has(queue)) {
            return;
        }

        await this.boss.createQueue(queue);
        this.ensuredQueues.add(queue);
    }

    private applyQueuePrefix(queue: string): string {
        return this.queuePrefix ? `${this.queuePrefix}-${queue}` : queue;
    }
}
