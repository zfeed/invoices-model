import { hash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { testDomainEventsBus } from '../../../shared/domain-events/domain-events-bus.test-helper';
import { KafkaDomainEventsBus } from './kafka-domain-events-bus';
import dayjs from '../../../lib/dayjs';
import { EventOutboxStorage } from '../../event-outbox/event-outbox';
import { DomainEvent } from '../../../shared/events/domain-event';
import { cleanDatabase } from '../../persistent-manager/clean-database';
import { kysely } from '../../../../database/kysely';
import { config } from '../../../config';

let domainEventsBus: KafkaDomainEventsBus;

const createKafkaConfig = (random: string) => ({
    global: {
        kafkaJS: {
            brokers: config.kafka.brokers,
            clientId: `${random}-example-client`,
            logLevel: 0,
        },
    },
    producer: {},
    consumer: {
        'group.id': `${random}-my-test-group`,
    },
});

testDomainEventsBus({
    typeName: KafkaDomainEventsBus.name,
    createDomainEventsBus: () => {
        const random = hash('sha256', Math.random().toString()).slice(0, 5);

        domainEventsBus = new KafkaDomainEventsBus({
            eventOutboxStorage: EventOutboxStorage.create(kysely),
            forceTopicCreation: true,
            topicPrefix: random,
            kafka: createKafkaConfig(random),
            polling: {
                interval: dayjs.duration(30, 'seconds'),
                timeout: dayjs.duration(5, 'minutes'),
                maxDeliveryAttempts: 10,
                batchSize: 10,
            },
        });

        return domainEventsBus;
    },
    beforeStart: async () => {
        await domainEventsBus.start();
        await sleep(dayjs.duration(500, 'milliseconds').asMilliseconds());
    },
    afterPublish: async () => {
        await sleep(dayjs.duration(500, 'milliseconds').asMilliseconds());
    },
    afterStop: async () => {
        await domainEventsBus.stop();
    },
});

class OutboxOrderPlacedEvent extends DomainEvent<{ orderId: string }> {}

const serializeEvent = (event: DomainEvent<unknown>) => ({
    id: event.id,
    name: event.name,
    payload: event.serialize(),
});

describe('KafkaDomainEventsBus - outbox polling', () => {
    let bus: KafkaDomainEventsBus;
    let eventOutboxStorage: EventOutboxStorage;

    beforeEach(async () => {
        await cleanDatabase(kysely);
        const random = hash('sha256', Math.random().toString()).slice(0, 5);
        eventOutboxStorage = EventOutboxStorage.create(kysely);

        bus = new KafkaDomainEventsBus({
            eventOutboxStorage,
            forceTopicCreation: true,
            topicPrefix: random,
            kafka: createKafkaConfig(random),
            polling: {
                interval: dayjs.duration(500, 'milliseconds'),
                timeout: dayjs.duration(0, 'seconds'),
                maxDeliveryAttempts: 10,
                batchSize: 10,
            },
        });
    });

    afterEach(async () => {
        await bus.stop();
    });

    it('should republish undelivered outbox events to subscribers', async () => {
        const collected: DomainEvent<unknown>[] = [];
        const event = OutboxOrderPlacedEvent.create({ orderId: 'outbox-1' });

        await bus.subscribeToEvent(OutboxOrderPlacedEvent, async (e) => {
            collected.push(e);
        });

        await eventOutboxStorage.insert([serializeEvent(event)]);
        await bus.start();
        await sleep(dayjs.duration(2, 'seconds').asMilliseconds());

        expect(collected).toHaveLength(1);
        expect(collected[0]).toEqual(
            expect.objectContaining({ data: { orderId: 'outbox-1' } })
        );
    });

    it('should not republish already delivered events', async () => {
        const collected: DomainEvent<unknown>[] = [];
        const event = OutboxOrderPlacedEvent.create({ orderId: 'delivered-1' });

        await bus.subscribeToEvent(OutboxOrderPlacedEvent, async (e) => {
            collected.push(e);
        });

        await eventOutboxStorage.insert([serializeEvent(event)]);
        await eventOutboxStorage.delivered(event.id);

        await bus.start();
        await sleep(dayjs.duration(2, 'seconds').asMilliseconds());

        expect(collected).toHaveLength(0);
    });

    it('should mark outbox events as delivered after successful republish', async () => {
        const event = OutboxOrderPlacedEvent.create({ orderId: 'mark-1' });

        await bus.subscribeToEvent(OutboxOrderPlacedEvent, async () => {});

        await eventOutboxStorage.insert([serializeEvent(event)]);
        await bus.start();
        await sleep(dayjs.duration(2, 'seconds').asMilliseconds());

        const remaining = await eventOutboxStorage.poll(10, {
            eventNames: [OutboxOrderPlacedEvent.eventName()],
            timeout: dayjs.duration(0, 'seconds'),
            maxDeliveryAttempts: 10,
        });

        expect(remaining).toHaveLength(0);
    });

    it('should do nothing when outbox is empty', async () => {
        const collected: DomainEvent<unknown>[] = [];

        await bus.subscribeToEvent(OutboxOrderPlacedEvent, async (e) => {
            collected.push(e);
        });

        await bus.start();
        await sleep(dayjs.duration(2, 'seconds').asMilliseconds());

        expect(collected).toHaveLength(0);
    });
});
