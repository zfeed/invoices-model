import { DomainEvent } from '../../../../building-blocks/events/domain-event';

type Data = {
    id: string;
    lineItems: {
        items: {
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
        }[];
        subtotal: {
            amount: string;
            currency: string;
        };
    };
    total: {
        amount: string;
        currency: string;
    };
    vatRate: string | null;
    vatAmount: {
        amount: string;
        currency: string;
    } | null;
    dueDate: string;
    issueDate: string;
    issuer: {
        type: string;
        name: string;
        address: string;
        taxId: string;
        email: string;
    };
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
    };
};

export class InvoiceCreatedEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super({ name: 'invoice.created', data });
    }
}
