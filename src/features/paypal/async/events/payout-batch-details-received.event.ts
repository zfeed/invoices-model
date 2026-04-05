import { DomainEvent } from '../../../../shared/events/domain-event';
import {
    ClientErrorResponse,
    OAuthErrorResponse,
    SuccessResponse,
} from '../../api/common/api-client';
import { ShowPayoutBatchDetailsResponse } from '../../api/payouts/payouts.types';

export type PayoutBatchDetailsReceivedEventData =
    | SuccessResponse<ShowPayoutBatchDetailsResponse>
    | ClientErrorResponse
    | OAuthErrorResponse;

export class PayoutBatchDetailsReceivedEvent extends DomainEvent<PayoutBatchDetailsReceivedEventData> {}
