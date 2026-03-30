import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['e2e/**/*.e2e.spec.ts'],
        setupFiles: ['dotenv/config', 'e2e/setup.ts'],
        globalSetup: ['e2e/global-setup.ts'],
        fileParallelism: false,
    },
});
