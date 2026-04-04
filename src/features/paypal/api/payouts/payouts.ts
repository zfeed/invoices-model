import { ApiClient } from '../common/api-client';
import { Path } from '../common/path';

import {
    CreateBatchPayoutRequestBody,
    CreateBatchPayoutResponse,
    ShowPayoutBatchDetailsQuery,
    ShowPayoutBatchDetailsResponse,
} from './payouts.types';

export class Payouts {
    constructor(readonly client: ApiClient) {}

    createBatchPayout(
        body: CreateBatchPayoutRequestBody,
        options: {
            accessToken: string;
        }
    ) {
        return this.client.post<CreateBatchPayoutResponse>({
            uri: {
                path: Path.create`v1/payments/payouts`,
            },
            headers: {
                authorization: `Bearer ${options.accessToken}`,
            },
            body,
        });
    }

    async showPayoutBatchDetails(
        payoutBatchId: string,
        accessToken: string,
        query?: ShowPayoutBatchDetailsQuery
    ) {
        return this.client.get<ShowPayoutBatchDetailsResponse>({
            uri: {
                path: Path.create`v1/payments/payouts/${payoutBatchId}`,
                query: query
                    ? {
                          fields: query.fields,
                          page: String(query.page),
                          pageSize: String(query.pageSize),
                          totalRequired: String(query.totalRequired),
                      }
                    : undefined,
            },
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });
    }
}
