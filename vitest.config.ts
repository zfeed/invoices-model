import { defineConfig } from 'vitest/config';

export default defineConfig({
    envDir: false,
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts'],
        exclude: ['node_modules/**'],
        globalSetup: ['test/global-setup.ts'],
        fileParallelism: false,
        typecheck: {
            enabled: true,
            checker: 'tsc',
            tsconfig: './tsconfig.json',
            include: ['src/**/*.spec.ts', 'e2e/**/*.spec.ts'],
        },
    },
});
