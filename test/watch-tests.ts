import { runWithEnvironment } from '../e2e/runtime/run-with-environment';

const main = async () => {
    const exitCode = await runWithEnvironment({
        vitestArgs: [],
    });

    process.exit(exitCode);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
