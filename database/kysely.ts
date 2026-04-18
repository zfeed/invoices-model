import { Kysely as BaseKysely } from 'kysely';
import type {
    Transaction as BaseTransaction,
    ControlledTransaction as BaseControlledTransaction,
} from 'kysely';
import { DB } from 'kysely-codegen';

export type Kysely = BaseKysely<DB>;
export type Transaction = BaseTransaction<DB>;
export type ControlledTransaction = BaseControlledTransaction<DB>;
