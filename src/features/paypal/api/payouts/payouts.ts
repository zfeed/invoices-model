import { Result } from '../../../../shared/result';
import { ApiClient, ApiResponse } from '../common/api-client';
import { Path } from '../common/path';
import { TokenManager } from '../common/token-manager';

import {
    CreateBatchPayoutRequestBody,
    CreateBatchPayoutResponse,
    ShowPayoutBatchDetailsQuery,
    ShowPayoutBatchDetailsResponse,
} from './payouts.types';

export class Payouts {
    constructor(
        readonly client: ApiClient,
        private readonly tokenManager: TokenManager
    ) {}

    async createBatchPayout(
        body: CreateBatchPayoutRequestBody,
        options?: { idempotencyKey?: string }
    ): Promise<Result<Error, ApiResponse<CreateBatchPayoutResponse>>> {
        const token = (await this.tokenManager.getAccessToken()).unwrap();

        return this.client.post<CreateBatchPayoutResponse>({
            uri: {
                path: Path.create`v1/payments/payouts`,
            },
            headers: {
                authorization: `Bearer ${token}`,
                ...(options?.idempotencyKey && {
                    'paypal-request-id': options.idempotencyKey,
                }),
            },
            body,
        });
    }

    async showPayoutBatchDetails(
        payoutBatchId: string,
        query?: ShowPayoutBatchDetailsQuery
    ): Promise<Result<Error, ApiResponse<ShowPayoutBatchDetailsResponse>>> {
        const token = await this.tokenManager.getAccessToken();

        if (token.isError()) {
            return token as Result<Error, never>;
        }

        return this.client.get<ShowPayoutBatchDetailsResponse>({
            uri: {
                path: Path.create`v1/payments/payouts/${payoutBatchId}`,
                query: query
                    ? {
                          fields: query.fields,
                          page: String(query.page),
                          page_size: String(query.page_size),
                          total_required: String(query.total_required),
                      }
                    : undefined,
            },
            headers: {
                authorization: `Bearer ${token.unwrap()}`,
            },
        });
    }
}
