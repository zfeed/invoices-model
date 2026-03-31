import { runWithEnvironment } from './runtime/run-with-environment';

const main = async () => {
    const exitCode = await runWithEnvironment({
        vitestArgs: ['run', '--config', 'vitest.e2e.config.ts'],
    });

    process.exit(exitCode);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
