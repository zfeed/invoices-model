import { DomainEvent } from '../../../../../building-blocks/events/domain-event';

type Data = {
    id: string;
    status: string;
};

export class InvoiceCancelledEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super({ name: 'invoice.cancelled', data });
    }
}
