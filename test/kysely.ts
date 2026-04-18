import { createKysely } from '../src/platform/container/dependencies/kysely.ts';
import { getConfig } from '../src/config.ts';
import type { Kysely } from '../database/kysely.ts';

let instance: Kysely | undefined;

export const getTestKysely = (): Kysely => {
    instance ??= createKysely(getConfig());
    return instance;
};
