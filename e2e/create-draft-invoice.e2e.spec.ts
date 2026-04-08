import {
    setupApp,
    expectError,
    resolveByPath,
    tooLong,
    expectValidationError,
    EMPTY_DRAFT_SHAPE,
} from './helpers';

const { postJson, postRaw } = setupApp();

describe('POST /invoices/drafts', () => {
    it('creates an empty draft invoice', async () => {
        const res = await postJson('/invoices/drafts', {});
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toEqual(EMPTY_DRAFT_SHAPE);
        expect(json.data.status).toBe('DRAFT');
    });

    it('creates a draft invoice with line items', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '10',
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.id).toEqual(expect.any(String));
        expect(json.data.status).toBe('DRAFT');
        expect(json.data.lineItems).toHaveLength(1);
        expect(json.data.lineItems[0].description).toBe('Service');
        expect(json.data.lineItems[0]).toEqual(
            expect.objectContaining({
                description: 'Service',
                priceAmount: '200',
                priceCurrency: 'USD',
                quantity: '1',
                totalAmount: '200',
                totalCurrency: 'USD',
            })
        );
        expect(json.data.subtotalAmount).toBe('200');
        expect(json.data.subtotalCurrency).toBe('USD');
    });

    it('returns 400 for invalid JSON', async () => {
        const res = await postRaw('/invoices/drafts', 'not json');
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

    it('returns 400 for validation error', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toEqual({
            error: {
                message: expect.any(String),
                issues: expect.any(Array),
            },
        });
        expect(json.error.issues.length).toBeGreaterThan(0);
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

    it('returns issue paths that resolve to the input object', async () => {
        const body = {
            lineItems: [{ description: 'Item', price: { amount: '100' } }],
        };
        const res = await postJson('/invoices/drafts', body);
        const json = await res.json();
        for (const issue of json.error.issues) {
            const parent = resolveByPath(body, issue.path.slice(0, -1));
            expect(parent).toBeDefined();
            expect(resolveByPath(body, issue.path)).toBeUndefined();
        }
    });

    it('returns 400 when line item description exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: tooLong(255),
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
        });
        await expectValidationError(res, ['lineItems', 0, 'description']);
    });

    it('returns 400 when line item price amount exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: tooLong(20), currency: 'USD' },
                    quantity: '1',
                },
            ],
        });
        await expectValidationError(res, ['lineItems', 0, 'price', 'amount']);
    });

    it('returns 400 when line item price currency exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: '100', currency: tooLong(3) },
                    quantity: '1',
                },
            ],
        });
        await expectValidationError(res, ['lineItems', 0, 'price', 'currency']);
    });

    it('returns 400 when line item quantity exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            lineItems: [
                {
                    description: 'Item',
                    price: { amount: '100', currency: 'USD' },
                    quantity: tooLong(20),
                },
            ],
        });
        await expectValidationError(res, ['lineItems', 0, 'quantity']);
    });

    it('returns 400 when vatRate exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            vatRate: tooLong(6),
        });
        await expectValidationError(res, ['vatRate']);
    });

    it('returns 400 when issueDate exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            issueDate: tooLong(10),
        });
        await expectValidationError(res, ['issueDate']);
    });

    it('returns 400 when dueDate exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            dueDate: tooLong(10),
        });
        await expectValidationError(res, ['dueDate']);
    });

    it('returns 400 when issuer fields exceed max length', async () => {
        const res = await postJson('/invoices/drafts', {
            issuer: {
                type: 'COMPANY',
                name: tooLong(255),
                address: tooLong(500),
                taxId: tooLong(50),
                email: tooLong(320),
            },
        });
        await expectValidationError(
            res,
            ['issuer', 'name'],
            ['issuer', 'address'],
            ['issuer', 'taxId'],
            ['issuer', 'email']
        );
    });

    it('returns 400 when recipient fields exceed max length', async () => {
        const res = await postJson('/invoices/drafts', {
            recipient: {
                type: 'INDIVIDUAL',
                name: tooLong(255),
                address: tooLong(500),
                taxId: tooLong(50),
                email: tooLong(320),
                taxResidenceCountry: tooLong(2),
                billing: { type: 'PAYPAL', email: 'ok@example.com' },
            },
        });
        await expectValidationError(
            res,
            ['recipient', 'name'],
            ['recipient', 'address'],
            ['recipient', 'taxId'],
            ['recipient', 'email'],
            ['recipient', 'taxResidenceCountry']
        );
    });

    it('returns 400 when paypal billing email exceeds max length', async () => {
        const res = await postJson('/invoices/drafts', {
            recipient: {
                type: 'INDIVIDUAL',
                name: 'Jane',
                address: '123 St',
                taxId: 'TAX1',
                email: 'jane@example.com',
                taxResidenceCountry: 'US',
                billing: { type: 'PAYPAL', email: tooLong(320) },
            },
        });
        await expectValidationError(res, ['recipient', 'billing', 'email']);
    });

    it('returns 422 for domain error', async () => {
        const res = await postJson('/invoices/drafts', {
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
