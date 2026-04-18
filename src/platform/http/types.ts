import { bootstrap } from '../../core/bootstrap.ts';

export type Commands = Awaited<ReturnType<typeof bootstrap>>;
