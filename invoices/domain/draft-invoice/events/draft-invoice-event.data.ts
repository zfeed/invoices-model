export type DraftInvoiceEventData = {
    id: string;
    lineItems: {
        items:
            | {
                  description: string;
                  price: {
                      amount: string;
                      currency: string;
                  };
                  quantity: string;
                  total: {
                      amount: string;
                      currency: string;
                  };
              }[]
            | null;
        subtotal: {
            amount: string;
            currency: string;
        } | null;
    } | null;
    total: {
        amount: string;
        currency: string;
    } | null;
    vatRate: string | null;
    vatAmount: {
        amount: string;
        currency: string;
    } | null;
    dueDate: string | null;
    issueDate: string | null;
    issuer: {
        type: string;
        name: string;
        address: string;
        taxId: string;
        email: string;
    } | null;
    recipient: {
        type: string;
        name: string;
        address: string;
        taxId: string;
        email: string;
        taxResidenceCountry: string;
        billing:
            | {
                  type: 'PAYPAL';
                  data: { email: string };
              }
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
    } | null;
};
