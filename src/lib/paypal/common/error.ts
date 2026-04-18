type ErrorDetail = {
    field?: string;
    value?: string;
    location?: 'body' | 'path' | 'query';
    issue: string;
    description: string;
};

type LinkDescription = {
    href: string;
    rel: string;
    method: string;
    encType?: string;
};

export type PayPalError = {
    name: string;
    message: string;
    debug_id: string;
    details?: ErrorDetail[];
    links?: LinkDescription[];
};

export type PayPalOAuthError = {
    error: string;
    error_description: string;
};
