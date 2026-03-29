import { DomainEvent } from '../../shared/events/domain-event';
import dayjs from '../../lib/dayjs';
import { cleanDatabase } from '../persistent-manager/clean-database';
import { EventOutboxStorage } from './event-outbox';

class InvoiceIssuedEvent extends DomainEvent<{ id: string }> {}

class InvoicePaidEvent extends DomainEvent<{ id: string }> {}

class EventOneEvent extends DomainEvent<Record<string, never>> {}

class EventTwoEvent extends DomainEvent<Record<string, never>> {}

class EventThreeEvent extends DomainEvent<Record<string, never>> {}

class EventFirstEvent extends DomainEvent<Record<string, never>> {}

class EventSecondEvent extends DomainEvent<Record<string, never>> {}

const ZERO_TIMEOUT = dayjs.duration(-1, 'seconds');
const LONG_TIMEOUT = dayjs.duration(30, 'seconds');

const REGISTRY = [
    InvoiceIssuedEvent,
    InvoicePaidEvent,
    EventOneEvent,
    EventTwoEvent,
    EventThreeEvent,
    EventFirstEvent,
    EventSecondEvent,
];

describe('EventOutboxStorage', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('insert', () => {
        it('should insert an event into the outbox', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            const event = InvoiceIssuedEvent.create({ id: '123' });
            await storage.insert([event]);

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(1);
            expect(events[0].name).toBe('invoice.issued');
            expect(events[0].data).toEqual({ id: '123' });
        });

        it('should insert multiple events in a single request', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([
                InvoiceIssuedEvent.create({ id: '1' }),
                InvoicePaidEvent.create({ id: '2' }),
            ]);

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.name).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should not fail when inserting empty array', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([]);

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(events).toHaveLength(0);
        });
    });

    describe('delivered', () => {
        it('should mark event as delivered so it is no longer polled', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            const event = InvoiceIssuedEvent.create({ id: '123' });
            await storage.insert([event]);

            await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            await storage.delivered(event);

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            expect(events).toHaveLength(0);
        });
    });

    describe('poll', () => {
        it('should return undelivered events', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([
                InvoiceIssuedEvent.create({ id: '1' }),
                InvoicePaidEvent.create({ id: '2' }),
            ]);

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.name).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should respect the limit', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([
                EventOneEvent.create({}),
                EventTwoEvent.create({}),
                EventThreeEvent.create({}),
            ]);

            const events = await storage.poll(2, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
        });

        it('should track delivery attempts internally', async () => {
            const maxAttempts = 2;
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([InvoiceIssuedEvent.create({ id: '1' })]);

            const opts = {
                maxDeliveryAttempts: maxAttempts,
                timeout: ZERO_TIMEOUT,
            };
            await storage.poll(10, opts);
            await storage.poll(10, opts);

            const events = await storage.poll(10, opts);
            expect(events).toHaveLength(0);
        });

        it('should not return events within the timeout window', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([InvoiceIssuedEvent.create({ id: '1' })]);

            const first = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(first).toHaveLength(1);

            const second = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(second).toHaveLength(0);
        });

        it('should return events after the timeout has elapsed', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([InvoiceIssuedEvent.create({ id: '1' })]);

            await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });

            const events = await storage.poll(10, {
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            expect(events).toHaveLength(1);
        });

        it('should not return events exceeding max delivery attempts', async () => {
            const maxAttempts = 3;
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([InvoiceIssuedEvent.create({ id: '1' })]);

            const opts = {
                maxDeliveryAttempts: maxAttempts,
                timeout: ZERO_TIMEOUT,
            };
            for (let i = 0; i < maxAttempts; i++) {
                await storage.poll(10, opts);
            }

            const events = await storage.poll(10, opts);
            expect(events).toHaveLength(0);
        });

        it('should throw when event name has no registered class', async () => {
            const storage = EventOutboxStorage.create([InvoicePaidEvent]);
            await storage.insert([InvoicePaidEvent.create({ id: '1' })]);

            // Replace with an event that has no registered class
            const unregistered = EventOutboxStorage.create([EventOneEvent]);

            await expect(
                unregistered.poll(10, {
                    maxDeliveryAttempts: 5,
                    timeout: LONG_TIMEOUT,
                })
            ).rejects.toThrow(
                'No event class registered for event name: invoice.paid'
            );
        });

        it('should pick oldest events first when limited', async () => {
            const storage = EventOutboxStorage.create(REGISTRY);
            await storage.insert([EventFirstEvent.create({})]);
            await storage.insert([EventSecondEvent.create({})]);

            const events = await storage.poll(1, {
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(1);
            expect(events[0].name).toBe('event.first');
        });
    });
});
