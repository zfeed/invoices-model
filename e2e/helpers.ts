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

    const get = async (path: string): Promise<TestResponse> => {
        const res = await app.inject({
            method: 'GET',
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
        get,
        getData,
        createDraft,
        createIssuedInvoice,
        createProcessingInvoice,
    };
};

export const resolveByPath = (obj: any, path: (string | number)[]): any =>
    path.reduce((acc, segment) => acc?.[segment], obj);

export const tooLong = (max: number) => 'a'.repeat(max + 1);

export const expectValidationError = async (
    res: { status: number; json: () => Promise<any> },
    ...paths: (string | number)[][]
) => {
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toBe('Validation failed');
    for (const path of paths) {
        expect(json.error.issues).toEqual(
            expect.arrayContaining([expect.objectContaining({ path })])
        );
    }
};

// --- Response shape matchers ---

const money = { amount: expect.any(String), currency: expect.any(String) };

const lineItem = {
    description: expect.any(String),
    price: money,
    quantity: expect.any(String),
    total: money,
};

const issuer = {
    type: expect.any(String),
    name: expect.any(String),
    address: expect.any(String),
    taxId: expect.any(String),
    email: expect.any(String),
};

const billing = {
    type: expect.any(String),
    data: expect.any(Object),
};

const recipient = {
    type: expect.any(String),
    name: expect.any(String),
    address: expect.any(String),
    taxId: expect.any(String),
    email: expect.any(String),
    taxResidenceCountry: expect.any(String),
    billing,
};

export const EMPTY_DRAFT_SHAPE = {
    id: expect.any(String),
    status: expect.any(String),
    lineItems: null,
    total: null,
    vatRate: null,
    vatAmount: null,
    issueDate: null,
    dueDate: null,
    issuer: null,
    recipient: null,
};

export const POPULATED_DRAFT_SHAPE = {
    id: expect.any(String),
    status: expect.any(String),
    lineItems: {
        items: expect.arrayContaining([expect.objectContaining(lineItem)]),
        subtotal: money,
    },
    total: money,
    vatRate: expect.any(String),
    vatAmount: money,
    issueDate: expect.any(String),
    dueDate: expect.any(String),
    issuer: expect.objectContaining(issuer),
    recipient: expect.objectContaining(recipient),
};

export const INVOICE_SHAPE = {
    id: expect.any(String),
    status: expect.any(String),
    lineItems: {
        items: expect.arrayContaining([expect.objectContaining(lineItem)]),
        subtotal: money,
    },
    total: money,
    vatRate: expect.toSatisfy(
        (v: unknown) => typeof v === 'string' || v === null
    ),
    vatAmount: expect.toSatisfy(
        (v: unknown) =>
            v === null ||
            (typeof v === 'object' &&
                v !== null &&
                'amount' in v &&
                'currency' in v)
    ),
    issueDate: expect.any(String),
    dueDate: expect.any(String),
    issuer: expect.objectContaining(issuer),
    recipient: expect.objectContaining(recipient),
};

const approver = {
    id: expect.any(String),
    name: expect.any(String),
    email: expect.any(String),
};

const groupTemplate = {
    id: expect.any(String),
    requiredApprovals: expect.any(Number),
    approvers: expect.arrayContaining([expect.objectContaining(approver)]),
};

const stepTemplate = {
    id: expect.any(String),
    order: expect.any(Number),
    groups: expect.arrayContaining([expect.objectContaining(groupTemplate)]),
};

const templateShape = {
    id: expect.any(String),
    range: { from: money, to: money },
    steps: expect.any(Array),
};

export const AUTHFLOW_POLICY_SHAPE = {
    id: expect.any(String),
    action: expect.any(String),
    templates: expect.any(Array),
};

const approval = {
    approverId: expect.any(String),
    createdAt: expect.any(String),
    comment: expect.toSatisfy(
        (v: unknown) => typeof v === 'string' || v === null
    ),
};

const group = {
    id: expect.any(String),
    requiredApprovals: expect.any(Number),
    isApproved: expect.any(Boolean),
    approvers: expect.any(Array),
    approvals: expect.any(Array),
};

const step = {
    id: expect.any(String),
    order: expect.any(Number),
    isApproved: expect.any(Boolean),
    groups: expect.arrayContaining([expect.objectContaining(group)]),
};

const authflow = {
    id: expect.any(String),
    action: expect.any(String),
    range: { from: money, to: money },
    isApproved: expect.any(Boolean),
    steps: expect.arrayContaining([expect.objectContaining(step)]),
};

export const DOCUMENT_SHAPE = {
    id: expect.any(String),
    referenceId: expect.any(String),
    value: money,
    authflows: expect.arrayContaining([expect.objectContaining(authflow)]),
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
