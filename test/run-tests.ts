import { runWithEnvironment } from '../e2e/runtime/run-with-environment';

const main = async () => {
    const exitCode = await runWithEnvironment({
        vitestArgs: ['run', ...process.argv.slice(2)],
    });

    process.exit(exitCode);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
