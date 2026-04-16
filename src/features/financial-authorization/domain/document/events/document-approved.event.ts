import { DomainEvent } from '../../../../../shared/events/domain-event.ts';

type Data = {
    id: string;
    referenceId: string;
    value: {
        amount: string;
        currency: string;
    };
    authflows: {
        id: string;
        action: string;
        range: {
            from: { amount: string; currency: string };
            to: { amount: string; currency: string };
        };
        isApproved: boolean;
        steps: {
            id: string;
            order: number;
            isApproved: boolean;
            groups: {
                id: string;
                isApproved: boolean;
                approvers: {
                    id: string;
                    name: string;
                    email: string;
                }[];
                approvals: {
                    approverId: string;
                    createdAt: string;
                    comment: string | null;
                }[];
            }[];
        }[];
    }[];
};

export class DocumentApprovedEvent extends DomainEvent<Data> {}
