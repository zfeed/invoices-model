import { randomUUID } from 'node:crypto';
import { KafkaContainer } from '@testcontainers/kafka';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const POSTGRES_IMAGE = 'postgres:18.2';
const KAFKA_IMAGE = 'confluentinc/cp-kafka:7.8.0';
const KAFKA_PORT = 9093;

export type StartedE2EEnvironment = {
    env: NodeJS.ProcessEnv;
    stop: () => Promise<void>;
};

export const startE2EEnvironment =
    async (): Promise<StartedE2EEnvironment> => {
        const runId = randomUUID();
        const [postgres, kafka] = await Promise.all([
            new PostgreSqlContainer(POSTGRES_IMAGE)
                .withDatabase('invoices_model_e2e')
                .withUsername('postgres')
                .withPassword('postgres')
                .start(),
            new KafkaContainer(KAFKA_IMAGE).withKraft().start(),
        ]);

        return {
            env: {
                ...process.env,
                DATABASE_URL: postgres.getConnectionUri(),
                KAFKA_BROKERS: `${kafka.getHost()}:${kafka.getMappedPort(
                    KAFKA_PORT
                )}`,
                KAFKA_CLIENT_ID: `invoices-model-e2e-${runId}`,
                KAFKA_GROUP_ID: `invoices-model-e2e-${runId}`,
                KAFKA_TOPIC_PREFIX: `invoices-model-e2e-${runId}`,
            },
            stop: async () => {
                await Promise.allSettled([kafka.stop(), postgres.stop()]);
            },
        };
    };
