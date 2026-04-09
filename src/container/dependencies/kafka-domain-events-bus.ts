import { KafkaDomainEventsBus } from '../../infrastructure/domain-events/kafka/kafka-domain-events-bus';
import { EventOutboxStorage } from '../../infrastructure/event-outbox/event-outbox';
import { Logger } from '../../shared/logger/logger';
import { toKafkaLogger } from '../../infrastructure/logger/kafka-logger-adapter';
import dayjs from '../../lib/dayjs';
import { config } from '../../config';

export const createKafkaDomainEventsBus = (
    eventOutboxStorage: EventOutboxStorage,
    logger: Logger
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
                    logger: toKafkaLogger(logger),
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
