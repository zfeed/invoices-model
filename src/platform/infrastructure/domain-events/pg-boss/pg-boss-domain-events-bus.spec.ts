import { hash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { testDomainEventsBus } from '../../../../core/building-blocks/interfaces/domain-events-bus/domain-events-bus.test-helper.ts';
import { PgBossDomainEventsBus } from './pg-boss-domain-events-bus.ts';
import { DomainEvent } from '../../../../core/building-blocks/events/domain-event.ts';
import { PublishableEvents } from '../../../../core/building-blocks/events/event-publisher.interface.ts';
import { getTestKysely } from '../../../../../test/kysely.ts';
import { getTestLogger } from '../../../../../test/logger.ts';
import { getConfig } from '../../../../config.ts';

const logger = getTestLogger();

const randomId = () => hash('sha256', Math.random().toString()).slice(0, 8);

const createBus = () =>
    new PgBossDomainEventsBus({
        connectionString: getConfig().database.url,
        queuePrefix: randomId(),
        pollingIntervalSeconds: 0.5,
        logger,
    });

let domainEventsBus: PgBossDomainEventsBus;

testDomainEventsBus({
    typeName: PgBossDomainEventsBus.name,
    createDomainEventsBus: () => {
        domainEventsBus = createBus();
        return domainEventsBus;
    },
    beforeStart: async () => {
        await domainEventsBus.start();
    },
    afterPublish: async () => {
        await sleep(2000);
    },
    afterStop: async () => {
        await domainEventsBus.stop();
    },
});

class TxOrderPlacedEvent extends DomainEvent<{ orderId: string }> {}

class FakePublisher implements PublishableEvents<DomainEvent<unknown>> {
    events: DomainEvent<unknown>[];

    constructor(...events: DomainEvent<unknown>[]) {
        this.events = events;
    }
}

describe('PgBossDomainEventsBus - transactional publish', () => {
    const kysely = getTestKysely();
    let bus: PgBossDomainEventsBus;

    beforeEach(() => {
        bus = createBus();
    });

    afterEach(async () => {
        await bus.stop();
    });

    it('delivers events when the transaction commits', async () => {
        const collected: DomainEvent<unknown>[] = [];

        await bus.subscribeToEvent(TxOrderPlacedEvent, async (event) => {
            collected.push(event);
        });
        await bus.start();

        const tx = await kysely.startTransaction().execute();
        await bus.publishEvents(
            tx,
            new FakePublisher(
                TxOrderPlacedEvent.create({ orderId: 'commit-1' })
            )
        );
        await tx.commit().execute();

        await sleep(2000);

        expect(collected).toHaveLength(1);
        expect(collected[0]).toEqual(
            expect.objectContaining({ data: { orderId: 'commit-1' } })
        );
    });

    it('does not deliver events when the transaction rolls back', async () => {
        const collected: DomainEvent<unknown>[] = [];

        await bus.subscribeToEvent(TxOrderPlacedEvent, async (event) => {
            collected.push(event);
        });
        await bus.start();

        const tx = await kysely.startTransaction().execute();
        await bus.publishEvents(
            tx,
            new FakePublisher(
                TxOrderPlacedEvent.create({ orderId: 'rollback-1' })
            )
        );
        await tx.rollback().execute();

        await sleep(2000);

        expect(collected).toHaveLength(0);
    });
});
