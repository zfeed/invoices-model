import { DomainEvent } from '../../../../../building-blocks/events/domain-event';

type Data = {
    id: string;
    status: string;
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
        billing: {
            type: 'PAYPAL';
            data: { email: string };
        };
    };
};

export class InvoiceProcessingEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super(data);
    }
}
