import { DomainEvent } from '../../../../../building-blocks/events/domain-event';

type Data = {
    id: string;
    action: string;
    templates: {
        id: string;
        range: {
            from: { amount: string; currency: string };
            to: { amount: string; currency: string };
        };
        steps: {
            id: string;
            order: number;
            groups: {
                id: string;
                approvers: {
                    id: string;
                    name: string;
                    email: string;
                }[];
            }[];
        }[];
    }[];
};

export class AuthflowPolicyCreatedEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super(data);
    }
}
