import { KafkaJS } from '@confluentinc/kafka-javascript';

export interface KafkaConfig {
    global: KafkaJS.CommonConstructorConfig;
    producer: KafkaJS.ProducerConstructorConfig;
    consumer: KafkaJS.ConsumerConstructorConfig;
}

export class Kafka {
    readonly kafka: KafkaJS.Kafka;
    readonly producer: KafkaJS.Producer;
    readonly consumer: KafkaJS.Consumer;

    constructor(config: KafkaConfig) {
        this.kafka = new KafkaJS.Kafka(config.global);
        this.producer = this.kafka.producer(config.producer);
        this.consumer = this.kafka.consumer(config.consumer);
    }

    async start(
        topics: string[],
        eachMessageHandler: KafkaJS.EachMessageHandler
    ): Promise<void> {
        await Promise.all([this.producer.connect(), this.consumer.connect()]);

        if (topics.length === 0) {
            return;
        }

        await this.consumer.subscribe({ topics });
        await this.consumer.run({
            eachMessage: eachMessageHandler,
        });
    }

    async stop(): Promise<void> {
        await Promise.all([
            this.consumer.disconnect(),
            this.producer.disconnect(),
        ]);
    }

    async ensureTopics(topics: string[]): Promise<void> {
        const admin = this.kafka.admin();

        await admin.connect();

        try {
            await admin.createTopics({
                topics: topics.map((topic) => ({ topic })),
            });
        } finally {
            await admin.disconnect();
        }
    }
}
