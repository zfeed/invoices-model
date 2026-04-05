import { DomainEvent } from '../../../../shared/events/domain-event';
import {
    ClientErrorResponse,
    OAuthErrorResponse,
    SuccessResponse,
} from '../../api/common/api-client';
import { CreateBatchPayoutResponse } from '../../api/payouts/payouts.types';

export type BatchPayoutCreatedEventData =
    | SuccessResponse<CreateBatchPayoutResponse>
    | ClientErrorResponse
    | OAuthErrorResponse;

export class BatchPayoutCreatedEvent extends DomainEvent<BatchPayoutCreatedEventData> {}
