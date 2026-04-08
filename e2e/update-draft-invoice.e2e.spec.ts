import {
    setupApp,
    expectError,
    tooLong,
    expectValidationError,
    EMPTY_DRAFT_SHAPE,
} from './helpers';

const { postJson, postRaw, createDraft } = setupApp();

describe('POST /invoices/drafts/:id/update', () => {
    it('updates a draft invoice', async () => {
        const draft = await createDraft();
        const res = await postJson(`/invoices/drafts/${draft.id}/update`, {
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
            ],
            vatRate: '20',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.id).toBe(draft.id);
        expect(json.data.status).toBe('DRAFT');
        expect(json.data.lineItems).toHaveLength(1);
        expect(json.data.lineItems[0]).toEqual({
            id: expect.any(String),
            description: 'Consulting',
            priceAmount: '100',
            priceCurrency: 'USD',
            quantity: '2',
            totalAmount: '200',
            totalCurrency: 'USD',
        });
        expect(json.data.subtotalAmount).toBe('200');
        expect(json.data.subtotalCurrency).toBe('USD');
        expect(json.data.vatRate).toBe('0.2');
        expect(json.data.vatAmount).toBe('40');
        expect(json.data.vatCurrency).toBe('USD');
        expect(json.data.totalAmount).toBe('240');
        expect(json.data.totalCurrency).toBe('USD');
    });

    it('updates with empty body', async () => {
        const draft = await createDraft();
        const res = await postJson(`/invoices/drafts/${draft.id}/update`, {});
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual({ ...EMPTY_DRAFT_SHAPE, id: draft.id });
    });

    it('returns 400 when string fields exceed max length', async () => {
        const draft = await createDraft();
        const res = await postJson(`/invoices/drafts/${draft.id}/update`, {
            lineItems: [
                {
                    description: tooLong(255),
                    price: { amount: tooLong(20), currency: tooLong(3) },
                    quantity: tooLong(20),
                },
            ],
            vatRate: tooLong(6),
        });
        await expectValidationError(
            res,
            ['lineItems', 0, 'description'],
            ['lineItems', 0, 'price', 'amount'],
            ['lineItems', 0, 'price', 'currency'],
            ['lineItems', 0, 'quantity'],
            ['vatRate']
        );
    });

    it('returns 422 for non-existent draft', async () => {
        const res = await postJson(
            '/invoices/drafts/non-existent-id/update',
            {}
        );
        await expectError(res, 422);
    });

    it('returns 400 for invalid JSON', async () => {
        const draft = await createDraft();
        const res = await postRaw(
            `/invoices/drafts/${draft.id}/update`,
            'not json'
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        for (const issue of json.error.issues) {
            expect(issue).toEqual({
                path: expect.any(Array),
                message: expect.any(String),
            });
            for (const segment of issue.path) {
                expect(['string', 'number']).toContain(typeof segment);
            }
        }
    });
});
