import { DomainEvent } from '../../building-blocks/events/domain-event';
import dayjs from '../../lib/dayjs';
import { cleanDatabase } from '../persistent-manager/clean-database';
import { EventOutboxStorage } from './event-outbox';

class InvoiceIssuedEvent extends DomainEvent<{ id: string }> {
    constructor(data: { id: string }) {
        super(data);
    }
}

class InvoicePaidEvent extends DomainEvent<{ id: string }> {
    constructor(data: { id: string }) {
        super(data);
    }
}

class EventOneEvent extends DomainEvent<Record<string, never>> {
    constructor() {
        super({});
    }
}

class EventTwoEvent extends DomainEvent<Record<string, never>> {
    constructor() {
        super({});
    }
}

class EventThreeEvent extends DomainEvent<Record<string, never>> {
    constructor() {
        super({});
    }
}

class EventFirstEvent extends DomainEvent<Record<string, never>> {
    constructor() {
        super({});
    }
}

class EventSecondEvent extends DomainEvent<Record<string, never>> {
    constructor() {
        super({});
    }
}

const ZERO_TIMEOUT = dayjs.duration(-1, 'seconds');
const LONG_TIMEOUT = dayjs.duration(30, 'seconds');

describe('EventOutboxStorage', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('insert', () => {
        it('should insert an event into the outbox', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            const event = new InvoiceIssuedEvent({ id: '123' });
            await storage.insert([event]);

            const events = await storage.poll(10);

            expect(events).toHaveLength(1);
            expect(events[0].event_name).toBe('invoice.issued');
            expect(events[0].payload).toEqual(event.serialize());
            expect(events[0].delivered_at).toBeNull();
        });

        it('should insert multiple events in a single request', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([
                new InvoiceIssuedEvent({ id: '1' }),
                new InvoicePaidEvent({ id: '2' }),
            ]);

            const events = await storage.poll(10);

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.event_name).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should not fail when inserting empty array', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([]);

            const events = await storage.poll(10);
            expect(events).toHaveLength(0);
        });
    });

    describe('delivered', () => {
        it('should mark event as delivered so it is no longer polled', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert([new InvoiceIssuedEvent({ id: '123' })]);

            const [event] = await storage.poll(10);
            await storage.delivered(event.id);

            const events = await storage.poll(10);
            expect(events).toHaveLength(0);
        });
    });

    describe('poll', () => {
        it('should return undelivered events', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([
                new InvoiceIssuedEvent({ id: '1' }),
                new InvoicePaidEvent({ id: '2' }),
            ]);

            const events = await storage.poll(10);

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.event_name).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should respect the limit', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([
                new EventOneEvent(),
                new EventTwoEvent(),
                new EventThreeEvent(),
            ]);

            const events = await storage.poll(2);

            expect(events).toHaveLength(2);
        });

        it('should increment delivery_attempts on poll', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert([new InvoiceIssuedEvent({ id: '1' })]);

            const [first] = await storage.poll(10);
            expect(first.delivery_attempts).toBe(1);

            const [second] = await storage.poll(10);
            expect(second.delivery_attempts).toBe(2);
        });

        it('should set last_attempted_at on poll', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([new InvoiceIssuedEvent({ id: '1' })]);

            const [event] = await storage.poll(10);

            expect(event.last_attempted_at).not.toBeNull();
        });

        it('should not return events within the timeout window', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([new InvoiceIssuedEvent({ id: '1' })]);

            const first = await storage.poll(10);
            expect(first).toHaveLength(1);

            const second = await storage.poll(10);
            expect(second).toHaveLength(0);
        });

        it('should return events after the timeout has elapsed', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert([new InvoiceIssuedEvent({ id: '1' })]);

            await storage.poll(10);

            const events = await storage.poll(10);
            expect(events).toHaveLength(1);
        });

        it('should not return events exceeding max delivery attempts', async () => {
            const maxAttempts = 3;
            const storage = EventOutboxStorage.create(
                ZERO_TIMEOUT,
                maxAttempts
            );
            await storage.insert([new InvoiceIssuedEvent({ id: '1' })]);

            for (let i = 0; i < maxAttempts; i++) {
                await storage.poll(10);
            }

            const events = await storage.poll(10);
            expect(events).toHaveLength(0);
        });

        it('should pick oldest events first when limited', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert([new EventFirstEvent()]);
            await storage.insert([new EventSecondEvent()]);

            const events = await storage.poll(1);

            expect(events).toHaveLength(1);
            expect(events[0].event_name).toBe('event.first');
        });
    });
});
