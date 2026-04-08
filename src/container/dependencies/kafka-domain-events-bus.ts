import { KafkaDomainEventsBus } from '../../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox';
import dayjs from '../../lib/dayjs';
import { config } from '../../config';

export const createKafkaDomainEventsBus = (
    eventOutboxStorage: EventOutboxStorage
): KafkaDomainEventsBus =>
    new KafkaDomainEventsBus({
        eventOutboxStorage,
        topicPrefix: config.kafka.topicPrefix,
        forceTopicCreation: true,
        kafka: {
            global: {
                kafkaJS: {
                    brokers: config.kafka.brokers,
                    clientId: config.kafka.clientId,
                    logLevel: 0,
                },
            },
            producer: {},
            consumer: {
                'group.id': config.kafka.groupId,
            },
        },
        polling: {
            interval: dayjs.duration(
                config.outbox.pollingIntervalSeconds,
                'seconds'
            ),
            timeout: dayjs.duration(
                config.outbox.pollingTimeoutMinutes,
                'minutes'
            ),
            maxDeliveryAttempts: config.outbox.maxDeliveryAttempts,
            batchSize: config.outbox.batchSize,
        },
    });
