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
        recipientType?: string;
        note?: string;
        senderItemId?: string;
        recipientWallet?: string;
        alternateNotificationMethod?: {
            phone?: {
                countryCode: string;
                nationalNumber: string;
                extensionNumber?: string;
            };
        };
        notificationLanguage?: string;
        applicationContext?: {
            socialFeedPrivacy?: string;
            hollerUrl?: string;
            logoUrl?: string;
        };
    }[];
    senderBatchHeader: {
        senderBatchId?: string;
        emailSubject?: string;
        emailMessage?: string;
        note?: string;
        recipientType?: string;
    };
};

export type CreateBatchPayoutResponse = {
    batchHeader: {
        senderBatchHeader: {
            senderBatchId: string;
            emailSubject: string;
            emailMessage: string;
        };
        payoutBatchId: string;
        batchStatus: string;
    };
    batchStatus: string;
    timeCreated?: string;
};

export type ShowPayoutBatchDetailsQuery = {
    fields: string;
    page: number;
    pageSize: number;
    totalRequired: boolean;
};

export type PayoutItem = {
    payoutItemId: string;
    transactionStatus: string;
    payoutItemFee: CurrencyValue;
    payoutBatchId: string;
    payoutItem: {
        recipientType: string;
        amount: CurrencyValue;
        note: string;
        receiver: string;
        senderItemId: string;
        recipientWallet: string;
        purpose: string;
    };
    timeProcessed: string;
    errors?: {
        name: string;
        message: string;
        informationLink: string;
        details: any[];
        links: any[];
    };
    links: {
        href: string;
        rel: string;
        method: string;
        encType: string;
    }[];
};

export type ShowPayoutBatchDetailsResponse = {
    batchHeader: {
        senderBatchHeader: {
            senderBatchId: string;
            emailSubject: string;
            emailMessage: string;
        };
        payoutBatchId: string;
        batchStatus: BatchStatus;
        timeCreated?: string;
        timeCompleted?: string;
        fundingSource: string;
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
