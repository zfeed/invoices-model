import dayjs from '../../lib/dayjs';
import { cleanDatabase } from './clean-database';
import { EventOutboxStorage } from './event-outbox-storage';

const ZERO_TIMEOUT = dayjs.duration(-1, 'seconds');
const LONG_TIMEOUT = dayjs.duration(30, 'seconds');

describe('EventOutboxStorage', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('insert', () => {
        it('should insert an event into the outbox', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '123' },
            });

            const events = await storage.poll(10);

            expect(events).toHaveLength(1);
            expect(events[0].event_name).toBe('invoice.issued');
            expect(events[0].payload).toEqual({ id: '123' });
            expect(events[0].delivered_at).toBeNull();
        });
    });

    describe('delivered', () => {
        it('should mark event as delivered so it is no longer polled', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '123' },
            });

            const [event] = await storage.poll(10);
            await storage.delivered(event.id);

            const events = await storage.poll(10);
            expect(events).toHaveLength(0);
        });
    });

    describe('poll', () => {
        it('should return undelivered events', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });
            await storage.insert({
                eventName: 'invoice.paid',
                payload: { id: '2' },
            });

            const events = await storage.poll(10);

            expect(events).toHaveLength(2);
            const names = events.map((e) => e.event_name).sort();
            expect(names).toEqual(['invoice.issued', 'invoice.paid']);
        });

        it('should respect the limit', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({ eventName: 'event.one', payload: {} });
            await storage.insert({ eventName: 'event.two', payload: {} });
            await storage.insert({ eventName: 'event.three', payload: {} });

            const events = await storage.poll(2);

            expect(events).toHaveLength(2);
        });

        it('should increment delivery_attempts on poll', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });

            const [first] = await storage.poll(10);
            expect(first.delivery_attempts).toBe(1);

            const [second] = await storage.poll(10);
            expect(second.delivery_attempts).toBe(2);
        });

        it('should set last_attempted_at on poll', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });

            const [event] = await storage.poll(10);

            expect(event.last_attempted_at).not.toBeNull();
        });

        it('should not return events within the timeout window', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });

            const first = await storage.poll(10);
            expect(first).toHaveLength(1);

            const second = await storage.poll(10);
            expect(second).toHaveLength(0);
        });

        it('should return events after the timeout has elapsed', async () => {
            const storage = EventOutboxStorage.create(ZERO_TIMEOUT, 5);
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });

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
            await storage.insert({
                eventName: 'invoice.issued',
                payload: { id: '1' },
            });

            for (let i = 0; i < maxAttempts; i++) {
                await storage.poll(10);
            }

            const events = await storage.poll(10);
            expect(events).toHaveLength(0);
        });

        it('should pick oldest events first when limited', async () => {
            const storage = EventOutboxStorage.create(LONG_TIMEOUT, 5);
            await storage.insert({ eventName: 'event.first', payload: {} });
            await storage.insert({ eventName: 'event.second', payload: {} });

            const events = await storage.poll(1);

            expect(events).toHaveLength(1);
            expect(events[0].event_name).toBe('event.first');
        });
    });
});
