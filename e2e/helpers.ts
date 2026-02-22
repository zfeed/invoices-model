import { Hono } from 'hono';
import { createApp } from '../src/http/create-app';

export const COMPLETE_DRAFT_REQUEST = {
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

export const setupApp = () => {
    let app: Hono;

    beforeEach(async () => {
        app = await createApp();
    });

    const postJson = (path: string, body: unknown) =>
        app.request(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

    const postRaw = (path: string, body: string) =>
        app.request(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });

    const post = (path: string) => app.request(path, { method: 'POST' });

    const getData = async (res: Response) => (await res.json()).data;

    const createDraft = async (body: unknown = {}) => {
        const res = await postJson('/invoices/drafts', body);
        return getData(res);
    };

    const createIssuedInvoice = async () => {
        const draft = await createDraft(COMPLETE_DRAFT_REQUEST);
        const res = await post(`/invoices/drafts/${draft.id}/complete`);
        return getData(res);
    };

    const createProcessingInvoice = async () => {
        const invoice = await createIssuedInvoice();
        await post(`/invoices/${invoice.id}/process`);
        return invoice;
    };

    return {
        postJson,
        postRaw,
        post,
        getData,
        createDraft,
        createIssuedInvoice,
        createProcessingInvoice,
    };
};

export const expectError = async (
    res: Response,
    status: number,
    messageCheck?: string
) => {
    expect(res.status).toBe(status);
    const json = await res.json();
    expect(json.error.message).toBeDefined();
    if (status === 422) {
        expect(json.error.code).toBeDefined();
    }
    if (messageCheck) {
        expect(json.error.message).toBe(messageCheck);
    }
};
