import { applySpec, map, prop } from 'ramda';
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

const toGroup = applySpec({
    id: prop('id'),
    approvers: (g: any) => map(toApprover, g.approvers),
});

const toStep = applySpec({
    id: prop('id'),
    order: prop('order'),
    groups: (s: any) => map(toGroup, s.groups),
});

const toRange = applySpec({
    from: (r: any) => toMoney(r.from),
    to: (r: any) => toMoney(r.to),
});

const toTemplate = applySpec({
    id: prop('id'),
    range: (t: any) => toRange(t.range),
    steps: (t: any) => map(toStep, t.steps),
});

const toData = applySpec<Data>({
    id: prop('id'),
    action: prop('action'),
    templates: (d: any) => map(toTemplate, d.templates),
    version: prop('version'),
});

export class AuthflowPolicyCreatedEvent extends DomainEvent<Data> {
    constructor(data: Data) {
        super({ name: 'authflow-policy.created', data: toData(data) });
    }
}
