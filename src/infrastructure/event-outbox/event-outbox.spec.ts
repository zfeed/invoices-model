import { DomainEvent } from '../../shared/events/domain-event';
import dayjs from '../../lib/dayjs';
import { cleanDatabase } from '../persistent-manager/clean-database';
import { EventOutboxStorage } from './event-outbox';

class InvoiceIssuedEvent extends DomainEvent<{ id: string }> {}

class InvoicePaidEvent extends DomainEvent<{ id: string }> {}

class EventOneEvent extends DomainEvent<Record<string, { id: string }>> {}

class EventTwoEvent extends DomainEvent<Record<string, { id: string }>> {}

class EventThreeEvent extends DomainEvent<Record<string, { id: string }>> {}

class EventFirstEvent extends DomainEvent<Record<string, { id: string }>> {}

class EventSecondEvent extends DomainEvent<Record<string, { id: string }>> {}

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

const EVENT_NAMES = REGISTRY.map((eventClass) => eventClass.eventName());

const serializeEvent = (event: DomainEvent<unknown>) => ({
    id: event.id,
    name: event.name,
    payload: event.serialize(),
});

describe('EventOutboxStorage', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('insert', () => {
        it('should insert an event into the outbox', async () => {
            const storage = EventOutboxStorage.create();
            const event = InvoiceIssuedEvent.create({ id: '123' });
            await storage.insert([serializeEvent(event)]);

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(1);
            expect(events[0].eventName).toBe('invoice.issued');
            expect(events[0].payload).toEqual(serializeEvent(event).payload);
        });

        it('should insert multiple events in a single request', async () => {
            const storage = EventOutboxStorage.create();
            const invoiceIssued = InvoiceIssuedEvent.create({ id: '1' });
            const invoicePaid = InvoicePaidEvent.create({ id: '2' });
            await storage.insert([
                serializeEvent(invoiceIssued),
                serializeEvent(invoicePaid),
            ]);

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.eventName).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should not fail when inserting empty array', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([]);

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(events).toHaveLength(0);
        });
    });

    describe('delivered', () => {
        it('should mark event as delivered so it is no longer polled', async () => {
            const storage = EventOutboxStorage.create();
            const event = InvoiceIssuedEvent.create({ id: '123' });
            await storage.insert([serializeEvent(event)]);

            await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            await storage.delivered(event.id);

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            expect(events).toHaveLength(0);
        });
    });

    describe('poll', () => {
        it('should return undelivered events', async () => {
            const storage = EventOutboxStorage.create();
            const invoiceIssued = InvoiceIssuedEvent.create({ id: '1' });
            const invoicePaid = InvoicePaidEvent.create({ id: '2' });
            await storage.insert([
                serializeEvent(invoiceIssued),
                serializeEvent(invoicePaid),
            ]);

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.eventName).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should respect the limit', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(EventOneEvent.create({})),
                serializeEvent(EventTwoEvent.create({})),
                serializeEvent(EventThreeEvent.create({})),
            ]);

            const events = await storage.poll(2, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(2);
        });

        it('should track delivery attempts internally', async () => {
            const maxAttempts = 2;
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(InvoiceIssuedEvent.create({ id: '1' })),
            ]);

            const opts = {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: maxAttempts,
                timeout: ZERO_TIMEOUT,
            };
            await storage.poll(10, opts);
            await storage.poll(10, opts);

            const events = await storage.poll(10, opts);
            expect(events).toHaveLength(0);
        });

        it('should not return events within the timeout window', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(InvoiceIssuedEvent.create({ id: '1' })),
            ]);

            const first = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(first).toHaveLength(1);

            const second = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });
            expect(second).toHaveLength(0);
        });

        it('should return events after the timeout has elapsed', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(InvoiceIssuedEvent.create({ id: '1' })),
            ]);

            await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });

            const events = await storage.poll(10, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: ZERO_TIMEOUT,
            });
            expect(events).toHaveLength(1);
        });

        it('should not return events exceeding max delivery attempts', async () => {
            const maxAttempts = 3;
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(InvoiceIssuedEvent.create({ id: '1' })),
            ]);

            const opts = {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: maxAttempts,
                timeout: ZERO_TIMEOUT,
            };
            for (let i = 0; i < maxAttempts; i++) {
                await storage.poll(10, opts);
            }

            const events = await storage.poll(10, opts);
            expect(events).toHaveLength(0);
        });

        it('should return only events matching the requested event names', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([
                serializeEvent(InvoiceIssuedEvent.create({ id: '1' })),
                serializeEvent(InvoicePaidEvent.create({ id: '2' })),
            ]);

            const events = await storage.poll(10, {
                eventNames: ['invoice.paid'],
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(1);
            expect(events[0].eventName).toBe('invoice.paid');
        });

        it('should pick oldest events first when limited', async () => {
            const storage = EventOutboxStorage.create();
            await storage.insert([serializeEvent(EventFirstEvent.create({}))]);
            await storage.insert([serializeEvent(EventSecondEvent.create({}))]);

            const events = await storage.poll(1, {
                eventNames: EVENT_NAMES,
                maxDeliveryAttempts: 5,
                timeout: LONG_TIMEOUT,
            });

            expect(events).toHaveLength(1);
            expect(events[0].eventName).toBe('event.first');
        });
    });
});
