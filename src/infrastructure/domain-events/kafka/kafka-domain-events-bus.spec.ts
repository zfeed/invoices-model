import { hash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { testDomainEventsBus } from '../../../shared/domain-events/domain-events-bus.test-helper';
import { KafkaDomainEventsBus } from './kafka-domain-events-bus';
import dayjs from '../../../lib/dayjs';

let domainEventsBus: KafkaDomainEventsBus;

testDomainEventsBus({
    typeName: KafkaDomainEventsBus.name,
    createDomainEventsBus: () => {
        const random = hash('sha256', Math.random().toString()).slice(0, 5);

        domainEventsBus = new KafkaDomainEventsBus({
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
