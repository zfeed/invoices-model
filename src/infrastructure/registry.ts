import { Store } from './store/store';

export type EntityClass = Function;
type Mapper = { toDomain: (plain: any) => any; toPlain: (entity: any) => any };

export const stores = new Map<EntityClass, Store<any>>();
export const mappers = new Map<EntityClass, Mapper>();

export function register(
    entityClass: EntityClass,
    mapper: Mapper
) {
    stores.set(entityClass, new Store());
    mappers.set(entityClass, mapper);
}
