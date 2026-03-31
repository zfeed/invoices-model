import path from 'node:path';
import { startE2EEnvironment } from './e2e-environment';
import { runCommand } from './run-command';

const node = process.execPath;
const kyselyBin = path.join(
    path.dirname(require.resolve('kysely-ctl/package.json')),
    'dist/bin.mjs'
);
const vitestBin = path.join(
    path.dirname(require.resolve('vitest/package.json')),
    'vitest.mjs'
);

export const runWithEnvironment = async ({
    vitestArgs,
}: {
    vitestArgs: string[];
}): Promise<number> => {
    const environment = await startE2EEnvironment();
    const env = environment.env;

    let cleaningUp = false;

    const cleanup = async () => {
        if (cleaningUp) {
            return;
        }

        cleaningUp = true;
        await environment.stop();
    };

    const handleSignal = async (signal: NodeJS.Signals) => {
        await cleanup();
        process.kill(process.pid, signal);
    };

    process.once('SIGINT', handleSignal);
    process.once('SIGTERM', handleSignal);

    try {
        const migrationExitCode = await runCommand({
            command: node,
            args: [kyselyBin, 'migrate:latest'],
            env,
        });

        if (migrationExitCode !== 0) {
            return migrationExitCode;
        }

        return await runCommand({
            command: node,
            args: [vitestBin, ...vitestArgs],
            env,
        });
    } finally {
        process.removeListener('SIGINT', handleSignal);
        process.removeListener('SIGTERM', handleSignal);
        await cleanup();
    }
};
