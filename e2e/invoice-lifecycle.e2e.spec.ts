import {
    setupApp,
    COMPLETE_DRAFT_REQUEST,
    expectError,
    EMPTY_DRAFT_SHAPE,
    POPULATED_DRAFT_SHAPE,
    INVOICE_SHAPE,
} from './helpers';

const { postJson, post, getData } = setupApp();

describe('Invoice lifecycle flows', () => {
    describe('create -> update -> complete -> process', () => {
        it('progresses through the full draft-to-processing flow', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            expect(createRes.status).toBe(200);
            const draft = await getData(createRes);
            expect(draft).toEqual(EMPTY_DRAFT_SHAPE);
            expect(draft.status).toBe('DRAFT');

            const updateRes = await postJson(
                `/invoices/drafts/${draft.id}/update`,
                COMPLETE_DRAFT_REQUEST
            );
            expect(updateRes.status).toBe(200);
            const updated = await getData(updateRes);
            expect(updated).toEqual(POPULATED_DRAFT_SHAPE);
            expect(updated.lineItems.items).toHaveLength(1);

            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            expect(completeRes.status).toBe(200);
            const invoice = await getData(completeRes);
            expect(invoice).toEqual(INVOICE_SHAPE);
            expect(invoice.status).toBe('ISSUED');

            const processRes = await post(`/invoices/${invoice.id}/process`);
            expect(processRes.status).toBe(200);
            const processed = await getData(processRes);
            expect(processed).toEqual(INVOICE_SHAPE);
            expect(processed.status).toBe('PROCESSING');
        });
    });

    describe('create -> complete -> cancel', () => {
        it('creates, completes, then cancels an invoice', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            expect(createRes.status).toBe(200);
            const draft = await getData(createRes);
            expect(draft).toEqual(POPULATED_DRAFT_SHAPE);

            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            expect(completeRes.status).toBe(200);
            const invoice = await getData(completeRes);
            expect(invoice).toEqual(INVOICE_SHAPE);
            expect(invoice.status).toBe('ISSUED');

            const cancelRes = await post(`/invoices/${invoice.id}/cancel`);
            expect(cancelRes.status).toBe(200);
            const cancelled = await getData(cancelRes);
            expect(cancelled).toEqual(INVOICE_SHAPE);
            expect(cancelled.status).toBe('CANCELLED');
        });
    });

    describe('create -> archive -> draft', () => {
        it('creates, archives, then un-archives a draft', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            expect(createRes.status).toBe(200);
            const draft = await getData(createRes);
            expect(draft).toEqual(EMPTY_DRAFT_SHAPE);
            expect(draft.status).toBe('DRAFT');

            const archiveRes = await post(
                `/invoices/drafts/${draft.id}/archive`
            );
            expect(archiveRes.status).toBe(200);
            const archived = await getData(archiveRes);
            expect(archived).toEqual({ ...EMPTY_DRAFT_SHAPE, id: draft.id });
            expect(archived.status).toBe('ARCHIVED');

            const draftRes = await post(`/invoices/drafts/${draft.id}/draft`);
            expect(draftRes.status).toBe(200);
            const unarchived = await getData(draftRes);
            expect(unarchived).toEqual({ ...EMPTY_DRAFT_SHAPE, id: draft.id });
            expect(unarchived.status).toBe('DRAFT');
        });
    });

    describe('invalid transitions', () => {
        it('cannot process a draft invoice', async () => {
            const createRes = await postJson('/invoices/drafts', {});
            const draft = await getData(createRes);
            const res = await post(`/invoices/${draft.id}/process`);
            await expectError(res, 422);
        });

        it('cannot cancel a processing invoice', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = await getData(createRes);
            const completeRes = await post(
                `/invoices/drafts/${draft.id}/complete`
            );
            const invoice = await getData(completeRes);
            await post(`/invoices/${invoice.id}/process`);

            const cancelRes = await post(`/invoices/${invoice.id}/cancel`);
            await expectError(cancelRes, 422);
        });

        it('cannot complete an already completed draft', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = await getData(createRes);
            await post(`/invoices/drafts/${draft.id}/complete`);

            const res = await post(`/invoices/drafts/${draft.id}/complete`);
            await expectError(res, 422);
        });

        it('cannot archive a completed draft', async () => {
            const createRes = await postJson(
                '/invoices/drafts',
                COMPLETE_DRAFT_REQUEST
            );
            const draft = await getData(createRes);
            await post(`/invoices/drafts/${draft.id}/complete`);

            const res = await post(`/invoices/drafts/${draft.id}/archive`);
            await expectError(res, 422);
        });
    });
});
