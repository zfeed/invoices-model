import {
    setupApp,
    expectError,
    tooLong,
    expectValidationError,
    EMPTY_DRAFT_SHAPE,
} from './helpers.ts';

const { postJson, postRaw } = setupApp();

describe('POST /invoices/drafts/calculate', () => {
    it('calculates totals for a draft invoice', async () => {
        const res = await postJson('/invoices/drafts/calculate', {
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '3',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.id).toEqual(expect.any(String));
        expect(json.data.status).toBe('DRAFT');
        expect(json.data.lineItems).toHaveLength(1);
        expect(json.data.lineItems[0]).toEqual({
            id: expect.any(String),
            description: 'Service',
            priceAmount: '200',
            priceCurrency: 'USD',
            quantity: '3',
            totalAmount: '600',
            totalCurrency: 'USD',
        });
        expect(json.data.subtotalAmount).toBe('600');
        expect(json.data.subtotalCurrency).toBe('USD');
        expect(json.data.vatRate).toBe('0.1');
        expect(json.data.vatAmount).toBe('60');
        expect(json.data.vatCurrency).toBe('USD');
        expect(json.data.totalAmount).toBe('660');
        expect(json.data.totalCurrency).toBe('USD');
        expect(json.data.issueDate).toBeNull();
        expect(json.data.dueDate).toBeNull();
        expect(json.data.issuer).toBeNull();
        expect(json.data.recipient).toBeNull();
    });

    it('calculates with empty body', async () => {
        const res = await postJson('/invoices/drafts/calculate', {});
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(EMPTY_DRAFT_SHAPE);
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/drafts/calculate', 'not json');
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

    it('returns 400 when string fields exceed max length', async () => {
        const res = await postJson('/invoices/drafts/calculate', {
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

    it('returns 422 for domain error', async () => {
        const res = await postJson('/invoices/drafts/calculate', {
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: '100', currency: 'ZZZ' },
                    quantity: '1',
                },
            ],
        });
        await expectError(res, 422);
    });
});
