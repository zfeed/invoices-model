import { hash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { testDomainEvents } from '../../../shared/domain-events/domain-events.test-helper';
import { KafkaDomainEvents } from './kafka-domain-events';
import dayjs from '../../../lib/dayjs';

let domainEvents: KafkaDomainEvents;

testDomainEvents({
    typeName: KafkaDomainEvents.name,
    createDomainEvents: () => {
        const random = hash('sha256', Math.random().toString()).slice(0, 5);

        domainEvents = new KafkaDomainEvents({
            forceTopicCreation: true,
            topicPrefix: random,
            kafka: {
                global: {
                    kafkaJS: {
                        brokers: process.env.KAFKA_BROKERS?.split(',') || [],
                        clientId: `${random}-example-client`,
                        logLevel: 0,
                    },
                },
                producer: {},
                consumer: {
                    'group.id': `${random}-my-test-group`,
                },
            },
        });

        return domainEvents;
    },
    beforeStart: async () => {
        await domainEvents.start();
        await sleep(dayjs.duration(500, 'milliseconds').asMilliseconds());
    },
    afterPublish: async () => {
        await sleep(dayjs.duration(500, 'milliseconds').asMilliseconds());
    },
    afterStop: async () => {
        await domainEvents.stop();
    },
});
