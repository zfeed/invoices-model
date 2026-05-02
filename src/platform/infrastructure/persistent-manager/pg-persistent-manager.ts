import { trace } from '@opentelemetry/api';
import { withSpan } from '../../../lib/with-span/with-span.ts';
import { DomainEventsBus } from '../../../core/building-blocks/interfaces/domain-events-bus/domain-events-bus.interface.ts';
import { Logger } from '../../../core/building-blocks/logger/logger.ts';
import {
    EntityClass,
    PersistentManager as PersistentManagerInterface,
} from '../../../core/building-blocks/unit-of-work/unit-of-work.interface.ts';
import type { Collection } from '../../../core/building-blocks/unit-of-work/collection/collection.ts';
import type { DomainEvent } from '../../../core/building-blocks/events/domain-event.ts';
import type { PublishableEvents } from '../../../core/building-blocks/events/event-publisher.interface.ts';
import type {
    Kysely,
    ControlledTransaction,
} from '../../../../database/kysely.ts';
import { EventOutboxStorage } from '../event-outbox/event-outbox.ts';
import type { EntityPersister } from './entity-persister.ts';

const tracer = trace.getTracer('persistent-manager');

type Entity = {
    id: { toString(): string };
} & PublishableEvents<DomainEvent<unknown>>;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PersistentManager implements PersistentManagerInterface<Entity> {
    private committed = false;
    private transaction: ControlledTransaction | null = null;

    constructor(
        private readonly kysely: Kysely,
        private readonly domainEventsBus: DomainEventsBus,
        private readonly eventOutboxStorage: EventOutboxStorage,
        private readonly persisters: EntityPersister<unknown>[],
        private readonly logger?: Logger
    ) {}

    async fork(): Promise<PersistentManagerInterface<Entity>> {
        const newManager = new PersistentManager(
            this.kysely,
            this.domainEventsBus,
            this.eventOutboxStorage,
            this.persisters,
            this.logger
        );
        await newManager.initTransaction();

        return newManager;
    }

    async get(entityClass: EntityClass, id: string): Promise<Entity | null> {
        if (!UUID_RE.test(id)) {
            return null;
        }

        const persister = this.findPersisterByClass(entityClass);
        const entity = await withSpan(
            tracer,
            `${entityClass.name}.select`,
            () => persister.select(this.getTransaction(), id)
        );

        return entity as Entity | null;
    }

    async findBy(
        entityClass: EntityClass,
        key: string,
        value: string
    ): Promise<Entity | null> {
        const persister = this.findPersisterByClass(entityClass);

        if (!persister.findBy) {
            throw new Error(
                `Persister for ${entityClass.name} does not support findBy`
            );
        }

        const entity = await persister.findBy(
            this.getTransaction(),
            key,
            value
        );

        return entity as Entity | null;
    }

    async rollback(): Promise<void> {
        if (this.committed) {
            return;
        }

        if (this.transaction) {
            this.logger?.debug('Rolling back persistent manager transaction');
            await this.transaction.rollback().execute();
        }
    }

    async commit(
        collections: [EntityClass, Collection<Entity>][]
    ): Promise<void> {
        if (this.committed) {
            throw new Error('Transaction already committed');
        }

        const tx = this.getTransaction();
        const allEntities: Entity[] = [];

        for (const [, collection] of collections) {
            for (const entity of collection.values()) {
                const persister = this.findPersisterByInstance(entity);
                await withSpan(tracer, `${entity.constructor.name}.merge`, () =>
                    persister.merge(tx, entity)
                );
                allEntities.push(entity);
            }
        }

        await this.eventOutboxStorage.insert(
            allEntities
                .flatMap((entity) => entity.events)
                .map((event) => ({
                    id: event.id,
                    name: event.name,
                    payload: event.serialize(),
                })),
            { transaction: tx }
        );

        await tx.commit().execute();
        this.committed = true;
        this.logger?.debug('Committed persistent manager transaction', {
            entityCount: allEntities.length,
        });
        await this.domainEventsBus.publishEvents(...allEntities);
    }

    private async initTransaction(): Promise<void> {
        this.logger?.debug('Starting persistent manager transaction');
        this.transaction = await this.kysely.startTransaction().execute();
    }

    private getTransaction(): ControlledTransaction {
        if (!this.transaction) {
            throw new Error('Transaction not initialized');
        }

        return this.transaction;
    }

    private findPersisterByClass(
        entityClass: EntityClass
    ): EntityPersister<unknown> {
        const persister = this.persisters.find(
            (p) => p.entityClass === entityClass
        );

        if (!persister) {
            throw new Error(`Unknown entity class: ${entityClass.name}`);
        }

        return persister;
    }

    private findPersisterByInstance(entity: Entity): EntityPersister<unknown> {
        const persister = this.persisters.find(
            (p) =>
                entity instanceof
                (p.entityClass as new (...args: never[]) => unknown)
        );

        if (!persister) {
            throw new Error(
                `No persister registered for entity: ${entity.constructor.name}`
            );
        }

        return persister;
    }
}
