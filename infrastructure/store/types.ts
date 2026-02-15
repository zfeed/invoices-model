type MoneyPlain = {
    amount: string;
    currency: string;
};

type LineItemPlain = {
    description: string;
    price: MoneyPlain;
    quantity: string;
    total: MoneyPlain;
};

type LineItemsPlain = {
    items: LineItemPlain[];
    subtotal: MoneyPlain;
};

type IssuerPlain = {
    type: 'INDIVIDUAL' | 'COMPANY';
    name: string;
    address: string;
    taxId: string;
    email: string;
};

type RecipientPlain = {
    type: 'INDIVIDUAL' | 'COMPANY';
    name: string;
    address: string;
    taxId: string;
    email: string;
    taxResidenceCountry: string;
    billing:
        | { type: 'PAYPAL'; data: { email: string } }
        | {
              type: 'WIRE';
              data: {
                  swift: string;
                  accountNumber: string;
                  accountHolderName: string;
                  bankName: string;
                  bankAddress: string;
                  bankCountry: string;
              };
          };
};

export type DraftInvoicePlain = {
    id: string;
    lineItems: LineItemsPlain | null;
    total: MoneyPlain | null;
    vatRate: string | null;
    vatAmount: MoneyPlain | null;
    issueDate: string | null;
    dueDate: string | null;
    issuer: IssuerPlain | null;
    recipient: RecipientPlain | null;
};

export type InvoicePlain = {
    id: string;
    lineItems: LineItemsPlain;
    total: MoneyPlain;
    vatRate: string | null;
    vatAmount: MoneyPlain | null;
    issueDate: string;
    dueDate: string;
    issuer: IssuerPlain;
    recipient: RecipientPlain;
};
