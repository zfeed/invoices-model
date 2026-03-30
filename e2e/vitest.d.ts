import 'vitest';

declare module 'vitest' {
    interface ProvidedContext {
        e2eBaseUrl: string;
    }
}
