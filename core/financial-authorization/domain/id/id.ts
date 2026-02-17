import { randomUUID } from 'crypto';

export type Id = string;

export function createId(): Id {
    return randomUUID();
}
