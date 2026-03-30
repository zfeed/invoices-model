import { beforeEach } from 'vitest';
import { cleanDatabase } from '../src/infrastructure/persistent-manager/clean-database';

beforeEach(async () => {
    await cleanDatabase();
});
