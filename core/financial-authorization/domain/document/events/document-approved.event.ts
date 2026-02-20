import { applySpec, map, prop } from 'ramda';
import { DomainEvent } from '../../../../../building-blocks/events/domain-event';

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
                    createdAt: Date;
                    comment: string | null;
                }[];
            }[];
        }[];
    }[];
    version: number;
};

const toMoney = applySpec<{ amount: string; currency: string }>({
    amount: prop('amount'),
    currency: prop('currency'),
});

const toApprover = applySpec<{ id: string; name: string; email: string }>({
    id: prop('id'),
    name: prop('name'),
    email: prop('email'),
});

const toApproval = applySpec<{
    approverId: string;
    createdAt: Date;
    comment: string | null;
}>({
    approverId: prop('approverId'),
    createdAt: prop('createdAt'),
    comment: prop('comment'),
});

const toGroup = applySpec({
    id: prop('id'),
    isApproved: prop('isApproved'),
    approvers: (g: any) => map(toApprover, g.approvers),
    approvals: (g: any) => map(toApproval, g.approvals),
});

const toStep = applySpec({
    id: prop('id'),
    order: prop('order'),
    isApproved: prop('isApproved'),
    groups: (s: any) => map(toGroup, s.groups),
});

const toRange = applySpec({
    from: (r: any) => toMoney(r.from),
    to: (r: any) => toMoney(r.to),
});

const toAuthflow = applySpec({
    id: prop('id'),
    action: prop('action'),
    range: (a: any) => toRange(a.range),
    isApproved: prop('isApproved'),
    steps: (a: any) => map(toStep, a.steps),
});

const toData = applySpec<Data>({
    id: prop('id'),
    referenceId: prop('referenceId'),
    value: (d: any) => toMoney(d.value),
    authflows: (d: any) => map(toAuthflow, d.authflows),
    version: prop('version'),
});

export class DocumentApprovedEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super({ name: 'document.approved', data: toData(data) });
    }
}
