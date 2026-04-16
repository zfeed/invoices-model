import { bootstrap } from '../bootstrap.ts';

export type Commands = Awaited<ReturnType<typeof bootstrap>>;
