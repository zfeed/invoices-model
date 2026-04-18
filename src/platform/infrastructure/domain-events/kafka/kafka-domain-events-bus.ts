import {
    DomainEvent,
    DomainEventClass,
} from '../../../../core/bulding-blocks/events/domain-event.ts';
import {
    EventHandler,
    DomainEventsBus,
} from '../../../../core/bulding-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';
import { PublishableEvents } from '../../../../core/bulding-blocks/events/event-publisher.interface.ts';
import { EventOutboxStorage } from '../../event-outbox/event-outbox.ts';
import { Kafka, KafkaConfig } from './kafka.ts';
import { Scheduler } from './sheduler.ts';
import { Duration } from '../../../../lib/dayjs/dayjs.ts';
import { trace, SpanKind } from '@opentelemetry/api';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { extractKafkaContext, injectKafkaHeaders } from './kafka-tracing.ts';
import { withSpan } from '../../../../lib/with-span/with-span.ts';

const tracer = trace.getTracer('domain-events-bus');

export type PollingConfig = {
    interval: Duration;
    timeout: Duration;
    maxDeliveryAttempts: number;
    batchSize: number;
};

export class KafkaDomainEventsBus implements DomainEventsBus {
    private readonly handlers = new Map<DomainEventClass, EventHandler[]>();
    readonly kafka: Kafka;
    private topicPrefix?: string;
    private forceTopicCreation?: boolean;
    private sheduler: Scheduler;
    private polling: PollingConfig;

    constructor(config: {
        kafka: KafkaConfig;
        eventOutboxStorage: EventOutboxStorage;
        topicPrefix?: string;
        forceTopicCreation?: boolean;
        polling: PollingConfig;
    }) {
        this.kafka = new Kafka(config.kafka);
        this.eventOutboxStorage = config.eventOutboxStorage;
        this.topicPrefix = config.topicPrefix;
        this.forceTopicCreation = config.forceTopicCreation;
        this.polling = config.polling;
        this.sheduler = new Scheduler({
            job: this.outbox.bind(this),
            interval: config.polling.interval,
        });
    }

    private readonly eventOutboxStorage: EventOutboxStorage;

    async start(): Promise<void> {
        const topics = [...this.handlers.keys()]
            .map((eventClass) => eventClass.eventName())
            .map((topic) => this.applyTopicPrefix(topic));

        if (this.forceTopicCreation) {
            await this.kafka.ensureTopics(topics);
        }

        await this.kafka.start(topics, async ({ topic, message }) => {
            if (message.value == null) {
                throw new Error('Message value is null');
            }

            const { event, handlers } = this.getHandlersAndEvents({
                topic,
                value: message.value,
            });

            const parentContext = extractKafkaContext(message.headers);

            await withSpan(
                tracer,
                `process ${topic}`,
                () => Promise.all(handlers.map((handler) => handler(event))),
                {
                    kind: SpanKind.CONSUMER,
                    attributes: {
                        'messaging.system': 'kafka',
                        'messaging.operation.type': 'process',
                        'messaging.operation.name': 'process',
                        'messaging.destination.name': topic,
                        'domain_events.event_name': event.name,
                        'domain_events.handlers_count': handlers.length,
                    },
                },
                parentContext
            );
        });

        await this.sheduler.start();
    }

    async stop(): Promise<void> {
        await this.kafka.stop();
        await this.sheduler.stop();
    }

    async publishEvents(
        ...objects: PublishableEvents<DomainEvent<unknown>>[]
    ): Promise<void> {
        const topicMessages = this.toTopicMessages(objects);

        if (topicMessages.length === 0) {
            return;
        }

        const messageCount = objects.flatMap((o) => o.events).length;

        await withSpan(
            tracer,
            'publish events',
            async (span) => {
                span.setAttribute(
                    'messaging.destination.names',
                    topicMessages.map((tm) => tm.topic)
                );

                await this.kafka.producer.sendBatch({ topicMessages });

                const eventIds = objects.flatMap((object) =>
                    object.events.map((event) => event.id)
                );

                await Promise.all(
                    eventIds.map((eventId) =>
                        this.eventOutboxStorage.delivered(eventId)
                    )
                );
            },
            {
                kind: SpanKind.PRODUCER,
                attributes: {
                    'messaging.system': 'kafka',
                    'messaging.operation.type': 'send',
                    'messaging.operation.name': 'publish',
                    'messaging.batch.message_count': messageCount,
                },
            }
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

    private toTopicMessages(
        objects: PublishableEvents<DomainEvent<unknown>>[]
    ): {
        topic: string;
        messages: { value: string; headers: KafkaJS.IHeaders }[];
    }[] {
        return [
            ...objects
                .flatMap((object) => object.events)
                .map((event) => {
                    return {
                        topic: this.applyTopicPrefix(event.name),
                        message: {
                            value: JSON.stringify(event.serialize()),
                            headers: injectKafkaHeaders(),
                        },
                    };
                })
                .reduce<
                    Map<string, { value: string; headers: KafkaJS.IHeaders }[]>
                >((messagesByTopic, { topic, message }) => {
                    const messages = messagesByTopic.get(topic) ?? [];
                    messages.push(message);
                    messagesByTopic.set(topic, messages);
                    return messagesByTopic;
                }, new Map())
                .entries(),
        ].map(([topic, messages]) => ({ topic, messages }));
    }

    private applyTopicPrefix(topic: string): string {
        return this.topicPrefix ? `${this.topicPrefix}-${topic}` : topic;
    }

    private getHandlersAndEvents({
        topic,
        value,
    }: {
        topic: string;
        value: Buffer<ArrayBufferLike>;
    }) {
        const eventClasses = [...this.handlers.keys()];

        const eventClass = eventClasses.find(
            (eventClass) =>
                this.applyTopicPrefix(eventClass.eventName()) === topic
        );

        if (!eventClass) {
            throw new Error(`No event class found for topic ${topic}`);
        }

        const serialized = JSON.parse(value.toString());

        const event = eventClass.deserialize(serialized);

        const handlers = this.handlers.get(eventClass) ?? [];

        return { event, handlers };
    }

    private getEventClassByEventName(eventName: string) {
        const eventClasses = [...this.handlers.keys()];

        const eventClass = eventClasses.find(
            (eventClass) => eventClass.eventName() === eventName
        );

        return eventClass;
    }

    private async outbox() {
        const records = await this.eventOutboxStorage.poll(
            this.polling.batchSize,
            {
                eventNames: [...this.handlers.keys()].map((eventClass) =>
                    eventClass.eventName()
                ),
                timeout: this.polling.timeout,
                maxDeliveryAttempts: this.polling.maxDeliveryAttempts,
            }
        );

        const publishers = records
            .map(({ eventName, payload }) => {
                const EventClass = this.getEventClassByEventName(eventName);
                if (!EventClass) {
                    throw new Error('Unexpected, EventClass not registered');
                }

                return EventClass.deserialize(payload as any);
            })
            .map((event) => ({
                events: [event],
            }));

        await this.publishEvents(...publishers);
    }
}
