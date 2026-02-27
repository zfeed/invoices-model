export type EntityClass = Function;

export type ModificationType = 'created' | 'updated';

export type CommitEntry = {
    entityClass: EntityClass;
    id: string;
    entity: any;
    modification: ModificationType;
};

export interface PersistentManager {
    get(entityClass: EntityClass, id: string): any | null;
    findBy(
        entityClass: EntityClass,
        key: string,
        value: string,
        tracked?: Iterable<any>
    ): any | null;
    commit(entries: CommitEntry[]): Promise<void>;
}
