import { KNOWN_ERROR_CODE } from './known-error-codes.ts';

// Human-readable meaning for each error code that can surface to API clients.
// Used to document individual 422 codes in the OpenAPI schema.
export const ERROR_CODE_DESCRIPTIONS: Partial<
    Record<KNOWN_ERROR_CODE, string>
> = {
    // invoices — line items & money
    [KNOWN_ERROR_CODE.LINE_ITEMS_EMPTY]: 'At least one line item is required.',
    [KNOWN_ERROR_CODE.LINE_ITEMS_DIFFERENT_CURRENCIES]:
        'All line items must share the same currency.',
    [KNOWN_ERROR_CODE.LINE_ITEMS_DUPLICATE]:
        'Line items must not contain duplicates.',
    [KNOWN_ERROR_CODE.LINE_ITEM_EMPTY_DESCRIPTION]:
        'A line item has an empty description.',
    [KNOWN_ERROR_CODE.LINE_ITEM_NOT_INTEGER_QUANTITY]:
        'A line item quantity must be a whole number.',
    [KNOWN_ERROR_CODE.LINE_ITEM_NOT_POSITIVE_QUANTITY]:
        'A line item quantity must be greater than zero.',
    [KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_INTEGER]:
        'A monetary amount must be an integer number of minor units.',
    [KNOWN_ERROR_CODE.MONEY_MINOR_UNITS_NOT_GTE_ZERO]:
        'A monetary amount must be zero or greater.',
    [KNOWN_ERROR_CODE.MONEY_CURRENCIES_NOT_EQUAL]:
        'Monetary amounts must share the same currency to be combined.',
    [KNOWN_ERROR_CODE.CURRENCY_NOT_ISO_4217]:
        'The currency is not a valid ISO 4217 code.',

    // invoices — dates, vat, parties
    [KNOWN_ERROR_CODE.CALENDAR_DATE_INVALID_FORMAT]:
        'A date is not in a valid format.',
    [KNOWN_ERROR_CODE.VAT_INVALID_PERCENTAGE]: 'The VAT percentage is invalid.',
    [KNOWN_ERROR_CODE.VAT_INVALID_RANGE]:
        'The VAT percentage is outside the allowed range.',
    [KNOWN_ERROR_CODE.EMAIL_INVALID_FORMAT]: 'An email address is not valid.',
    [KNOWN_ERROR_CODE.COUNTRY_CODE_NOT_ISO_3166_1_ALPHA_2]:
        'The country code is not a valid ISO 3166-1 alpha-2 code.',
    [KNOWN_ERROR_CODE.ISSUER_EMPTY_FIELD]: 'A required issuer field is empty.',
    [KNOWN_ERROR_CODE.RECIPIENT_EMPTY_FIELD]:
        'A required recipient field is empty.',

    // invoices — draft & invoice lifecycle
    [KNOWN_ERROR_CODE.DRAFT_INVOICE_LINE_ITEMS_EMPTY]:
        'The draft invoice has no line items.',
    [KNOWN_ERROR_CODE.DRAFT_INVOICE_NOT_FULLY_COMPLETE]:
        'The draft invoice is missing required fields and cannot be completed.',
    [KNOWN_ERROR_CODE.DRAFT_INVOICE_INVALID_STATUS_TRANSITION]:
        'The draft invoice cannot transition to the requested status from its current status.',
    [KNOWN_ERROR_CODE.INVOICE_INVALID_STATUS_TRANSITION]:
        'The invoice cannot transition to the requested status from its current status.',
    [KNOWN_ERROR_CODE.INVOICE_DUE_DATE_ISSUE_DATE_INVALID_RANGE]:
        'The due date must not be earlier than the issue date.',
    [KNOWN_ERROR_CODE.PAYMENT_NOT_AUTHORIZED]:
        'The payment was not authorized.',
    [KNOWN_ERROR_CODE.ITEM_NOT_FOUND]: 'The referenced entity was not found.',

    // financial-authorization — value objects
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK]:
        'An approver name must not be blank.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT]:
        'An approver email address is not valid.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK]:
        'The action must not be blank.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK]:
        'The reference id must not be blank.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE]:
        'A step order must not be negative.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE]:
        'Step orders within an authflow must be unique.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER]:
        'A monetary amount must be an integer.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO]:
        'A monetary amount must be zero or greater.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217]:
        'The currency is not a valid ISO 4217 code.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL]:
        'The range boundaries must use the same currency.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO]:
        'The range start must not be greater than its end.',

    // financial-authorization — aggregates
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP]:
        'The authflow policy templates have overlapping money ranges.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND]:
        'The financial document was not found.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND]:
        'No authflow is associated with the document.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS]:
        'The authflow has no pending steps left to approve.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND]:
        'The approval group was not found.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY]:
        'The approval group has no approvers.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE]:
        'The approval group contains duplicate approvers.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND]:
        'The approver is not part of the approval group.',
    [KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE]:
        'The approver has already approved this action.',
};
