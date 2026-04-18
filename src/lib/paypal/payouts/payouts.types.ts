export type BatchStatus =
    | 'DENIED'
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'CANCELED';

export type CurrencyValue = {
    currency: string;
    value: string;
};

export type CreateBatchPayoutRequestBody = {
    items: {
        receiver: string;
        amount: CurrencyValue;
        recipient_type?: string;
        note?: string;
        sender_item_id?: string;
        recipient_wallet?: string;
        alternate_notification_method?: {
            phone?: {
                country_code: string;
                national_number: string;
                extension_number?: string;
            };
        };
        notification_language?: string;
        application_context?: {
            social_feed_privacy?: string;
            holler_url?: string;
            logo_url?: string;
        };
    }[];
    sender_batch_header: {
        sender_batch_id?: string;
        email_subject?: string;
        email_message?: string;
        note?: string;
        recipient_type?: string;
    };
};

export type CreateBatchPayoutResponse = {
    batch_header: {
        sender_batch_header: {
            sender_batch_id: string;
            email_subject: string;
            email_message: string;
        };
        payout_batch_id: string;
        batch_status: string;
    };
    links: {
        href: string;
        rel: string;
        method: string;
        encType: string;
    }[];
};

export type ShowPayoutBatchDetailsQuery = {
    fields: string;
    page: number;
    page_size: number;
    total_required: boolean;
};

export type PayoutItem = {
    payout_item_id: string;
    transaction_status: string;
    payout_item_fee: CurrencyValue;
    payout_batch_id: string;
    payout_item: {
        recipient_type: string;
        amount: CurrencyValue;
        note: string;
        receiver: string;
        sender_item_id: string;
        recipient_wallet: string;
        purpose: string;
    };
    time_processed: string;
    errors?: {
        name: string;
        message: string;
        debug_id: string;
        information_link: string;
        details: {
            field: string;
            value: string;
            location: string;
            issue: string;
            description: string;
        }[];
        links: {
            href: string;
            rel: string;
            method: string;
        }[];
    };
    links: {
        href: string;
        rel: string;
        method: string;
        encType: string;
    }[];
};

export type ShowPayoutBatchDetailsResponse = {
    total_items: number;
    total_pages: number;
    batch_header: {
        sender_batch_header: {
            sender_batch_id: string;
            email_subject: string;
            email_message: string;
        };
        payout_batch_id: string;
        batch_status: BatchStatus;
        time_created?: string;
        time_completed?: string;
        funding_source: string;
        amount: CurrencyValue;
        fees: CurrencyValue;
    };
    items: PayoutItem[];
    links: {
        href: string;
        rel: string;
        method: string;
        encType: string;
    }[];
};

export type CancelPayoutItemResponse = PayoutItem;
