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

export const startE2EEnvironment = async (): Promise<StartedE2EEnvironment> => {
    const [postgres, kafka] = await Promise.all([
        new PostgreSqlContainer(POSTGRES_IMAGE)
            .withDatabase('invoices_model_e2e')
            .withUsername('postgres')
            .withPassword('postgres')
            .withTmpFs({
                '/var/lib/postgresql':
                    'rw,noexec,nosuid,size=512m,uid=999,gid=999,mode=0700',
            })
            .start(),
        new KafkaContainer(KAFKA_IMAGE)
            .withKraft()
            .withEnvironment({
                KAFKA_LOG_DIRS: '/tmp/kafka-logs',
                KAFKA_METADATA_LOG_DIR: '/tmp/kafka-logs',
            })
            .withTmpFs({
                '/tmp': 'rw,noexec,nosuid,size=512m,uid=1000,gid=1000,mode=1777',
            })
            .start(),
    ]);

    return {
        env: {
            ...process.env,
            DATABASE_URL: postgres.getConnectionUri(),
            KAFKA_BROKERS: `${kafka.getHost()}:${kafka.getMappedPort(
                KAFKA_PORT
            )}`,
            KAFKA_CLIENT_ID: `invoices-model-e2e`,
            KAFKA_GROUP_ID: `invoices-model-e2e`,
            KAFKA_TOPIC_PREFIX: `invoices-model-e2e`,
        },
        stop: async () => {
            await Promise.allSettled([kafka.stop(), postgres.stop()]);
        },
    };
};
