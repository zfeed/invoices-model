import { Client, Dispatcher } from 'undici';

import { Duration } from '../../dayjs/dayjs.ts';
import { Result } from '../../result/result.ts';
import { PayPalError, PayPalOAuthError } from './error.ts';
import { Path } from './path.ts';
import { Retry, RetryConfig } from './retry.ts';

type ResponseHeaders = Dispatcher.ResponseData['headers'];

type Hooks = {
    onRequest?: (options: Dispatcher.DispatchOptions) => void;
    onResponse?: (response: Dispatcher.ResponseData) => void;
    onError?: (error: unknown) => void;
};

export type Config = {
    baseUrl: URL;
    hooks?: Hooks;
    retry?: RetryConfig;
    timeout?: Duration;
    maxResponseSizeBytes?: number;
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

export type SuccessResponse<T> = {
    statusCode: 200 | 201;
    headers: ResponseHeaders;
    body: T;
};

export type ClientErrorStatusCode =
    | 400
    | 401
    | 403
    | 404
    | 405
    | 409
    | 415
    | 422;

export type RetryableErrorStatusCode = 429 | 500 | 503;

export type ClientErrorResponse = {
    statusCode: Exclude<ClientErrorStatusCode, 401>;
    headers: ResponseHeaders;
    body: PayPalError;
};

export type RetryableErrorResponse = {
    statusCode: RetryableErrorStatusCode;
    headers: ResponseHeaders;
    body: PayPalError;
};

export type OAuthErrorResponse = {
    statusCode: 401;
    headers: ResponseHeaders;
    body: PayPalOAuthError;
};

export type ApiResponse<T = unknown> =
    | SuccessResponse<T>
    | ClientErrorResponse
    | RetryableErrorResponse
    | OAuthErrorResponse;

export class ApiClient {
    private client: Client;
    private retry: Retry | null;
    private timeoutMs: number | undefined;

    constructor(private config: Config) {
        this.client = new Client(config.baseUrl, {
            maxResponseSize: config.maxResponseSizeBytes,
        });
        this.retry = config.retry ? new Retry(config.retry) : null;
        this.timeoutMs = config.timeout?.asMilliseconds();
    }

    async get<R>(request: RequestBase): Promise<Result<Error, ApiResponse<R>>> {
        return this.send<R>({
            path: `/${request.uri.path.value}`,
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
        const contentType =
            request.headers?.['content-type'] ?? 'application/json';

        const body =
            contentType === 'application/x-www-form-urlencoded'
                ? new URLSearchParams(
                      request.body as Record<string, string>
                  ).toString()
                : JSON.stringify(request.body);

        return this.send<R>({
            path: `/${request.uri.path.value}`,
            query: request.uri.query,
            origin: this.config.baseUrl,
            method: 'POST',
            headers: {
                'content-type': contentType,
                ...request.headers,
            },
            body,
        });
    }

    private async sendOnce<R>(
        options: Dispatcher.RequestOptions
    ): Promise<Result<Error, ApiResponse<R>>> {
        this.config.hooks?.onRequest?.(options);

        try {
            const response = await this.client.request({
                ...options,
                headersTimeout: this.timeoutMs,
                bodyTimeout: this.timeoutMs,
            });

            this.config.hooks?.onResponse?.(response);

            const text = (await response.body.text()).trim();
            const body: unknown = text.length > 0 ? JSON.parse(text) : null;

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

    private async send<R>(
        options: Dispatcher.RequestOptions
    ): Promise<Result<Error, ApiResponse<R>>> {
        if (!this.retry) {
            return this.sendOnce(options);
        }

        return this.retry.execute(
            () => this.sendOnce<R>(options),
            (result) => result.isOk() && result.unwrap().statusCode === 429
        );
    }
}
