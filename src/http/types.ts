import { bootstrap } from '../bootstrap';

export type Commands = Awaited<ReturnType<typeof bootstrap>>;
