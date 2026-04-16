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
        typecheck: {
            enabled: true,
            checker: 'tsc',
            tsconfig: './tsconfig.json',
            include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'e2e/**/*.spec.ts'],
        },
    },
});
