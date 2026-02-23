import { bootstrap } from '../core/bootstrap';

export type Commands = Awaited<ReturnType<typeof bootstrap>>;
