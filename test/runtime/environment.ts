import { GenericContainer, Wait } from 'testcontainers';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const POSTGRES_IMAGE = 'postgres:18.2';
const TEMPORAL_IMAGE = 'temporalio/admin-tools:1.30';
const TEMPORAL_GRPC_PORT = 7233;

export type StartedTestEnvironment = {
    env: NodeJS.ProcessEnv;
    stop: () => Promise<void>;
};

export const startTestEnvironment =
    async (): Promise<StartedTestEnvironment> => {
        const [postgres, temporal] = await Promise.all([
            new PostgreSqlContainer(POSTGRES_IMAGE)
                .withDatabase('invoices_model_e2e')
                .withUsername('postgres')
                .withPassword('postgres')
                .withTmpFs({
                    '/var/lib/postgresql':
                        'rw,noexec,nosuid,size=512m,uid=999,gid=999,mode=0700',
                })
                .start(),
            new GenericContainer(TEMPORAL_IMAGE)
                .withCommand([
                    'temporal',
                    'server',
                    'start-dev',
                    '--ip',
                    '0.0.0.0',
                    '--namespace',
                    'default',
                ])
                .withExposedPorts(TEMPORAL_GRPC_PORT)
                .withWaitStrategy(Wait.forLogMessage(/Temporal Server:/))
                .start(),
        ]);

        return {
            env: {
                ...process.env,
                DATABASE_URL: postgres.getConnectionUri(),
                TEMPORAL_ADDRESS: `${temporal.getHost()}:${temporal.getMappedPort(
                    TEMPORAL_GRPC_PORT
                )}`,
                TEMPORAL_NAMESPACE: 'default',
            },
            stop: async () => {
                await Promise.allSettled([temporal.stop(), postgres.stop()]);
            },
        };
    };
