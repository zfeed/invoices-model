import { DomainEvent } from '../events/domain-event';
import { PublishableEvents } from '../events/event-publisher.interface';
import { DomainEvents } from './domain-events.interface';

class OrderPlacedEvent extends DomainEvent<{ orderId: string }> {}

class OrderCancelledEvent extends DomainEvent<{ orderId: string }> {}

class FakePublisher implements PublishableEvents<DomainEvent<unknown>> {
    events: DomainEvent<unknown>[] = [];

    constructor(...events: DomainEvent<unknown>[]) {
        this.events = events;
    }
}

export interface DomainEventsTestConfig {
    typeName: string;
    createDomainEvents: () => DomainEvents;
    beforeStart?: () => Promise<void>;
    afterStop?: () => Promise<void>;
    afterPublish?: () => Promise<void>;
}

export function testDomainEvents(config: DomainEventsTestConfig): void {
    describe(`${config.typeName} - DomainEvents implementation`, () => {
        let domainEvents: DomainEvents;

        beforeEach(() => {
            domainEvents = config.createDomainEvents();
        });

        afterEach(async () => {
            await config.afterStop?.();
        });

        describe('publishEvents', () => {
            it('should call the handler when a matching event is published', async () => {
                const collected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(OrderPlacedEvent.create({ orderId: 'order-1' }))
                );
                await config.afterPublish?.();

                expect(collected).toHaveLength(1);
                expect(collected[0]).toEqual(
                    expect.objectContaining({
                        data: { orderId: 'order-1' },
                    })
                );
            });

            it('should not call the handler when a different event is published', async () => {
                const collected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(
                        OrderCancelledEvent.create({ orderId: 'order-1' })
                    )
                );
                await config.afterPublish?.();

                expect(collected).toHaveLength(0);
            });

            it('should call multiple handlers for the same event type', async () => {
                const collected1: DomainEvent<unknown>[] = [];
                const collected2: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected1.push(event);
                    }
                );
                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected2.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(OrderPlacedEvent.create({ orderId: 'order-1' }))
                );
                await config.afterPublish?.();

                expect(collected1).toHaveLength(1);
                expect(collected2).toHaveLength(1);
            });

            it('should handle multiple events from a single publisher', async () => {
                const collected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(
                        OrderPlacedEvent.create({ orderId: 'order-1' }),
                        OrderPlacedEvent.create({ orderId: 'order-2' })
                    )
                );
                await config.afterPublish?.();

                expect(collected).toHaveLength(2);
            });

            it('should handle multiple publishers', async () => {
                const collected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(OrderPlacedEvent.create({ orderId: 'order-1' })),
                    new FakePublisher(
                        OrderPlacedEvent.create({ orderId: 'order-2' })
                    )
                );
                await config.afterPublish?.();

                expect(collected).toHaveLength(2);
            });

            it('should dispatch each event only to its matching handler', async () => {
                const placedCollected: DomainEvent<unknown>[] = [];
                const cancelledCollected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        placedCollected.push(event);
                    }
                );
                await domainEvents.subscribeToEvent(
                    OrderCancelledEvent,
                    async (event) => {
                        cancelledCollected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(
                    new FakePublisher(
                        OrderPlacedEvent.create({ orderId: 'order-1' }),
                        OrderCancelledEvent.create({ orderId: 'order-2' })
                    )
                );
                await config.afterPublish?.();

                expect(placedCollected).toHaveLength(1);
                expect(placedCollected[0]).toEqual(
                    expect.objectContaining({
                        data: { orderId: 'order-1' },
                    })
                );
                expect(cancelledCollected).toHaveLength(1);
                expect(cancelledCollected[0]).toEqual(
                    expect.objectContaining({
                        data: { orderId: 'order-2' },
                    })
                );
            });

            it('should do nothing when publishing events with no subscribers', async () => {
                await config.beforeStart?.();

                await expect(
                    domainEvents.publishEvents(
                        new FakePublisher(OrderPlacedEvent.create({ orderId: 'order-1' }))
                    )
                ).resolves.not.toThrow();
            });

            it('should do nothing when publishing an empty publisher', async () => {
                const collected: DomainEvent<unknown>[] = [];

                await domainEvents.subscribeToEvent(
                    OrderPlacedEvent,
                    async (event) => {
                        collected.push(event);
                    }
                );
                await config.beforeStart?.();
                await domainEvents.publishEvents(new FakePublisher());
                await config.afterPublish?.();

                expect(collected).toHaveLength(0);
            });
        });
    });
}
