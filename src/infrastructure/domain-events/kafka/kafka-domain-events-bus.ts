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
import dayjs from '../../../lib/dayjs';

export class KafkaDomainEventsBus implements DomainEventsBus {
    private readonly handlers = new Map<DomainEventClass, EventHandler[]>();
    readonly kafka: Kafka;
    private topicPrefix?: string;
    private forceTopicCreation?: boolean;
    private sheduler: Scheduler;

    constructor(config: {
        kafka: KafkaConfig;
        eventOutboxStorage: EventOutboxStorage;
        topicPrefix?: string;
        forceTopicCreation?: boolean;
    }) {
        this.kafka = new Kafka(config.kafka);
        this.eventOutboxStorage = config.eventOutboxStorage;
        this.topicPrefix = config.topicPrefix;
        this.forceTopicCreation = config.forceTopicCreation;
        this.sheduler = new Scheduler({
            job: this.outbox.bind(this),
            interval: dayjs.duration(30, 'seconds'),
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

            await Promise.all(handlers.map((handler) => handler(event)));
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
    ): { topic: string; messages: { value: string }[] }[] {
        return [
            ...objects
                .flatMap((object) => object.events)
                .map((event) => ({
                    topic: this.applyTopicPrefix(event.name),
                    message: {
                        value: JSON.stringify(event.serialize()),
                    },
                }))
                .reduce<Map<string, { value: string }[]>>(
                    (messagesByTopic, { topic, message }) => {
                        const messages = messagesByTopic.get(topic) ?? [];
                        messages.push(message);
                        messagesByTopic.set(topic, messages);
                        return messagesByTopic;
                    },
                    new Map()
                )
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
        const records = await this.eventOutboxStorage.poll(10, {
            eventNames: [...this.handlers.keys()].map((eventClass) =>
                eventClass.eventName()
            ),
            timeout: dayjs.duration(5, 'minutes'),
            maxDeliveryAttempts: 10,
        });

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
