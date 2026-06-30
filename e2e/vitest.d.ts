import 'vitest';

declare module 'vitest' {
    interface ProvidedContext {
        e2eBaseUrl: string;
        e2eOrganizationId: string;
        e2eMemberId: string;
    }
}
