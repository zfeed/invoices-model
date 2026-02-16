import { DomainEvent } from '../../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../../building-blocks/events/event-publisher.interface';
import { InMemoryDomainEvents } from '../../../infrastructure/domain-events/in-memory-domain-events';

class OrderPlacedEvent extends DomainEvent<{ orderId: string }> {
    constructor(orderId: string) {
        super({ name: 'order.placed', data: { orderId } });
    }
}

class OrderCancelledEvent extends DomainEvent<{ orderId: string }> {
    constructor(orderId: string) {
        super({ name: 'order.cancelled', data: { orderId } });
    }
}

class FakePublisher implements PublishableEvents<DomainEvent<unknown>> {
    events: DomainEvent<unknown>[] = [];

    constructor(...events: DomainEvent<unknown>[]) {
        this.events = events;
    }
}

describe('DomainEvents contract (InMemory)', () => {
    describe('publishEvents', () => {
        it('should call the handler when a matching event is published', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler);
            domainEvents.publishEvents(
                new FakePublisher(new OrderPlacedEvent('order-1'))
            );

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(
                expect.objectContaining({ data: { orderId: 'order-1' } })
            );
        });

        it('should not call the handler when a different event is published', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler);
            domainEvents.publishEvents(
                new FakePublisher(new OrderCancelledEvent('order-1'))
            );

            expect(handler).not.toHaveBeenCalled();
        });

        it('should call multiple handlers for the same event type', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler1);
            domainEvents.subscribeToEvent(OrderPlacedEvent, handler2);
            domainEvents.publishEvents(
                new FakePublisher(new OrderPlacedEvent('order-1'))
            );

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple events from a single publisher', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler);
            domainEvents.publishEvents(
                new FakePublisher(
                    new OrderPlacedEvent('order-1'),
                    new OrderPlacedEvent('order-2')
                )
            );

            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('should handle multiple publishers', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler);
            domainEvents.publishEvents(
                new FakePublisher(new OrderPlacedEvent('order-1')),
                new FakePublisher(new OrderPlacedEvent('order-2'))
            );

            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('should dispatch each event only to its matching handler', () => {
            const domainEvents = new InMemoryDomainEvents();
            const placedHandler = jest.fn();
            const cancelledHandler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, placedHandler);
            domainEvents.subscribeToEvent(
                OrderCancelledEvent,
                cancelledHandler
            );
            domainEvents.publishEvents(
                new FakePublisher(
                    new OrderPlacedEvent('order-1'),
                    new OrderCancelledEvent('order-2')
                )
            );

            expect(placedHandler).toHaveBeenCalledTimes(1);
            expect(placedHandler).toHaveBeenCalledWith(
                expect.objectContaining({ data: { orderId: 'order-1' } })
            );
            expect(cancelledHandler).toHaveBeenCalledTimes(1);
            expect(cancelledHandler).toHaveBeenCalledWith(
                expect.objectContaining({ data: { orderId: 'order-2' } })
            );
        });

        it('should do nothing when publishing events with no subscribers', () => {
            const domainEvents = new InMemoryDomainEvents();

            expect(() =>
                domainEvents.publishEvents(
                    new FakePublisher(new OrderPlacedEvent('order-1'))
                )
            ).not.toThrow();
        });

        it('should do nothing when publishing an empty publisher', () => {
            const domainEvents = new InMemoryDomainEvents();
            const handler = jest.fn();

            domainEvents.subscribeToEvent(OrderPlacedEvent, handler);
            domainEvents.publishEvents(new FakePublisher());

            expect(handler).not.toHaveBeenCalled();
        });
    });
});
