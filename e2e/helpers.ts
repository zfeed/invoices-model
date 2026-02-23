import { FastifyInstance } from 'fastify';
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

type TestResponse = {
    status: number;
    json: () => Promise<any>;
};

const toTestResponse = (res: {
    statusCode: number;
    json: () => any;
}): TestResponse => ({
    status: res.statusCode,
    json: () => Promise.resolve(res.json()),
});

export const setupApp = () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = await createApp();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    const postJson = async (
        path: string,
        body: unknown
    ): Promise<TestResponse> => {
        const res = await app.inject({
            method: 'POST',
            url: path,
            headers: { 'Content-Type': 'application/json' },
            payload: JSON.stringify(body),
        });
        return toTestResponse(res);
    };

    const postRaw = async (
        path: string,
        body: string
    ): Promise<TestResponse> => {
        const res = await app.inject({
            method: 'POST',
            url: path,
            headers: { 'Content-Type': 'application/json' },
            payload: body,
        });
        return toTestResponse(res);
    };

    const post = async (path: string): Promise<TestResponse> => {
        const res = await app.inject({
            method: 'POST',
            url: path,
        });
        return toTestResponse(res);
    };

    const getData = async (res: TestResponse) => (await res.json()).data;

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
    res: TestResponse,
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
