import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(fileName: string) {
    const envPath = resolve(process.cwd(), fileName);
    if (existsSync(envPath)) {
        process.loadEnvFile(envPath);
    }
}
