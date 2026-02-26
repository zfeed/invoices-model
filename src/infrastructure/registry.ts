export type EntityClass = Function;
type Mapper = { toDomain: (plain: any) => any; toPlain: (entity: any) => any };

export const mappers = new Map<EntityClass, Mapper>();

export function register(entityClass: EntityClass, mapper: Mapper) {
    mappers.set(entityClass, mapper);
}
