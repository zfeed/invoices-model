import { Hono } from 'hono';
import { createApp } from '../src/http/create-app';

let app: Hono;

const COMPLETE_DRAFT_REQUEST = {
    lineItems: [
        {
            description: 'Service',
            price: { amount: '200', currency: 'USD' },
            quantity: '1',
        },
    ],
    vatRate: '10',
    issueDate: '2025-01-01',
    dueDate: '2025-02-01',
    issuer: {
        type: 'COMPANY',
        name: 'Company Inc.',
        address: '123 Main St',
        taxId: 'TAX123',
        email: 'info@company.com',
    },
    recipient: {
        type: 'INDIVIDUAL',
        name: 'Jane Smith',
        address: '456 Oak Ave',
        taxId: 'TAX456',
        email: 'jane@example.com',
        taxResidenceCountry: 'US',
        billing: {
            type: 'PAYPAL',
            email: 'jane@paypal.com',
        },
    },
};

beforeEach(async () => {
    app = await createApp();
});

const postJson = (path: string, body: unknown) =>
    app.request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

const post = (path: string) => app.request(path, { method: 'POST' });

const putJson = (path: string, body: unknown) =>
    app.request(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

describe('Invoice lifecycle flows', () => {
    describe('create -> update -> complete -> process', () => {
        it('progresses through the full draft-to-processing flow', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            expect(createRes.status).toBe(201);
            const draft = (await createRes.json()).data;
            expect(draft.status).toBe('DRAFT');

            const updateRes = await putJson(
                `/invoices/drafts/${draft.id}`,
                COMPLETE_DRAFT_REQUEST
            );
            expect(updateRes.status).toBe(200);
            const updated = (await updateRes.json()).data;
            expect(updated.lineItems.items).toHaveLength(1);

            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            expect(completeRes.status).toBe(200);
            const invoice = (await completeRes.json()).data;
            expect(invoice.status).toBe('ISSUED');

            const processRes = await post(
                `/invoices/${invoice.id}/process`
            );
            expect(processRes.status).toBe(200);
            const processed = (await processRes.json()).data;
            expect(processed.status).toBe('PROCESSING');
        });
    });

    describe('create -> complete -> cancel', () => {
        it('creates, completes, then cancels an invoice', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            expect(createRes.status).toBe(201);
            const draft = (await createRes.json()).data;

            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            expect(completeRes.status).toBe(200);
            const invoice = (await completeRes.json()).data;
            expect(invoice.status).toBe('ISSUED');

            const cancelRes = await post(
                `/invoices/${invoice.id}/cancel`
            );
            expect(cancelRes.status).toBe(200);
            const cancelled = (await cancelRes.json()).data;
            expect(cancelled.status).toBe('CANCELLED');
        });
    });

    describe('create -> archive -> draft', () => {
        it('creates, archives, then un-archives a draft', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            expect(createRes.status).toBe(201);
            const draft = (await createRes.json()).data;
            expect(draft.status).toBe('DRAFT');

            const archiveRes = await post(
                `/invoices/drafts/${draft.id}/archive`
            );
            expect(archiveRes.status).toBe(200);
            const archived = (await archiveRes.json()).data;
            expect(archived.status).toBe('ARCHIVED');

            const draftRes = await post(
                `/invoices/drafts/${draft.id}/draft`
            );
            expect(draftRes.status).toBe(200);
            const unarchived = (await draftRes.json()).data;
            expect(unarchived.status).toBe('DRAFT');
        });
    });

    describe('invalid transitions', () => {
        it('cannot process a draft invoice', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            const draft = (await createRes.json()).data;
            const res = await post(`/invoices/${draft.id}/process`);
            expect(res.status).toBe(422);
        });

        it('cannot cancel a processing invoice', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = (await createRes.json()).data;
            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            const invoice = (await completeRes.json()).data;
            await post(`/invoices/${invoice.id}/process`);

            const cancelRes = await post(
                `/invoices/${invoice.id}/cancel`
            );
            expect(cancelRes.status).toBe(422);
        });

        it('cannot complete an already completed draft', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = (await createRes.json()).data;
            await post(`/invoices/drafts/${draft.id}/complete`);

            const res = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            expect(res.status).toBe(422);
        });

        it('cannot archive a completed draft', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = (await createRes.json()).data;
            await post(`/invoices/drafts/${draft.id}/complete`);

            const res = await post(
                `/invoices/drafts/${draft.id}/archive`
            );
            expect(res.status).toBe(422);
        });
    });
});
