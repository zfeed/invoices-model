import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['e2e/**/*.e2e.spec.ts'],
        setupFiles: ['dotenv/config'],
        globalSetup: ['e2e/global-setup.ts'],
        fileParallelism: false,
    },
});
