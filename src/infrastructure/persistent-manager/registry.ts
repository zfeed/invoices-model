import { EntityClass } from '../../core/shared/unit-of-work/unit-of-work.interface';

export type { EntityClass };
type Mapper = { toDomain: (plain: any) => any; toPlain: (entity: any) => any };

export const mappers = new Map<EntityClass, Mapper>();

export function register(entityClass: EntityClass, mapper: Mapper) {
    mappers.set(entityClass, mapper);
}
