import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        exclude: ['node_modules/**'],
        setupFiles: ['dotenv/config'],
        globalSetup: ['test/global-setup.ts'],
        fileParallelism: false,
    },
});
