import { Client, Dispatcher } from 'undici';
import type { IncomingHttpHeaders } from 'undici/types/header';

import { Result } from '../../../../shared/result';
import { PayPalError, PayPalOAuthError } from './error';
import { Path } from './path';

type Hooks = {
    onRequest?: (options: Dispatcher.DispatchOptions) => void;
    onResponse?: (response: Dispatcher.ResponseData) => void;
    onError?: (error: unknown) => void;
};

export type Config = {
    baseUrl: URL;
    hooks?: Hooks;
};

type RequestBase = {
    uri: {
        path: Path;
        query?: Record<string, string>;
    };
    headers?: Record<string, string>;
};

type PostRequest = RequestBase & {
    body: Record<string, unknown>;
};

type SuccessResponse<T> = {
    statusCode: 200;
    headers: IncomingHttpHeaders;
    body: T;
};

type ErrorResponse = {
    statusCode: 400 | 403 | 404 | 405 | 409 | 415 | 422 | 429 | 500 | 503;
    headers: IncomingHttpHeaders;
    body: PayPalError;
};

type OAuthErrorResponse = {
    statusCode: 401;
    headers: IncomingHttpHeaders;
    body: PayPalOAuthError;
};

export type ApiResponse<T = unknown> =
    | SuccessResponse<T>
    | ErrorResponse
    | OAuthErrorResponse;

export class ApiClient {
    private client: Client;

    constructor(private config: Config) {
        this.client = new Client(config.baseUrl);
    }

    async get<R>(request: RequestBase): Promise<Result<Error, ApiResponse<R>>> {
        return this.send<R>({
            path: request.uri.path.value,
            query: request.uri.query,
            origin: this.config.baseUrl,
            method: 'GET',
            headers: {
                ...request.headers,
            },
        });
    }

    async post<R>(
        request: PostRequest
    ): Promise<Result<Error, ApiResponse<R>>> {
        return this.send<R>({
            path: request.uri.path.value,
            query: request.uri.query,
            origin: this.config.baseUrl,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...request.headers,
            },
            body: JSON.stringify(request.body),
        });
    }

    private async send<R>(
        options: Dispatcher.RequestOptions
    ): Promise<Result<Error, ApiResponse<R>>> {
        this.config.hooks?.onRequest?.(options);

        try {
            const response = await this.client.request(options);

            this.config.hooks?.onResponse?.(response);

            const body: unknown = await response.body.json();

            return Result.ok({
                statusCode: response.statusCode,
                headers: response.headers,
                body,
            } as ApiResponse<R>);
        } catch (error) {
            this.config.hooks?.onError?.(error);

            return Result.error(
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }
}
