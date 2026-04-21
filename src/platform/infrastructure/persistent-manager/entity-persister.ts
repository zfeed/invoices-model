import type { ControlledTransaction } from '../../../../database/kysely.ts';
import type { EntityClass } from '../../../core/building-blocks/unit-of-work/unit-of-work.interface.ts';

export interface EntityPersister<E> {
    readonly entityClass: EntityClass;
    select(tx: ControlledTransaction, id: string): Promise<E | null>;
    merge(tx: ControlledTransaction, entity: E): Promise<void>;
    findBy?(
        tx: ControlledTransaction,
        key: string,
        value: string
    ): Promise<E | null>;
}
