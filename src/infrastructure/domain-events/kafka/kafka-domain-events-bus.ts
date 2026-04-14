import {
    DomainEvent,
    DomainEventClass,
} from '../../../shared/events/domain-event';
import {
    EventHandler,
    DomainEventsBus,
} from '../../../shared/domain-events/domain-events-bus.interface';
import { PublishableEvents } from '../../../shared/events/event-publisher.interface';
import { EventOutboxStorage } from '../../event-outbox/event-outbox';
import { Kafka, KafkaConfig } from './kafka';
import { Scheduler } from './sheduler';
import { Duration } from '../../../lib/dayjs';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { extractKafkaContext, injectKafkaHeaders } from './kafka-tracing';

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

            await tracer.startActiveSpan(
                `${topic} handle`,
                {
                    kind: SpanKind.CONSUMER,
                    attributes: {
                        'messaging.system': 'kafka',
                        'messaging.operation.type': 'receive',
                        'messaging.destination.name': topic,
                        'domain_events.event_name': event.name,
                        'domain_events.handlers_count': handlers.length,
                    },
                },
                parentContext,
                async (span) => {
                    try {
                        await Promise.all(
                            handlers.map((handler) => handler(event))
                        );
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

        await tracer.startActiveSpan(
            'domain-events publish',
            {
                kind: SpanKind.PRODUCER,
                attributes: {
                    'messaging.system': 'kafka',
                    'messaging.operation.type': 'publish',
                    'domain_events.event_count': objects.flatMap(
                        (o) => o.events
                    ).length,
                },
            },
            async (span) => {
                try {
                    span.setAttribute(
                        'domain_events.topics',
                        topicMessages.map((tm) => tm.topic)
                    );

                    await this.kafka.producer.sendBatch({
                        topicMessages,
                    });

                    const eventIds = objects.flatMap((object) =>
                        object.events.map((event) => event.id)
                    );

                    await Promise.all(
                        eventIds.map((eventId) =>
                            this.eventOutboxStorage.delivered(eventId)
                        )
                    );
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
