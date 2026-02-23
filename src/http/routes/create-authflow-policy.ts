import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../types';
import { parse } from '../validation';
import { Money } from '../../core/financial-authorization/domain/money/money';
import { Range } from '../../core/financial-authorization/domain/range/range';
import { Order } from '../../core/financial-authorization/domain/order/order';
import { Name } from '../../core/financial-authorization/domain/name/name';
import { Email } from '../../core/financial-authorization/domain/email/email';
import { Approver } from '../../core/financial-authorization/domain/approver/approver';
import { GroupTemplate } from '../../core/financial-authorization/domain/groups/group-template';
import { StepTemplate } from '../../core/financial-authorization/domain/step/step-template';
import { AuthflowTemplate } from '../../core/financial-authorization/domain/authflow/authflow-template';

const approverSchema = z.object({
    name: z.string(),
    email: z.string(),
});

const groupSchema = z.object({
    approvers: z.array(approverSchema),
});

const stepSchema = z.object({
    order: z.number(),
    groups: z.array(groupSchema),
});

const moneySchema = z.object({
    amount: z.string(),
    currency: z.string(),
});

const templateSchema = z.object({
    range: z.object({
        from: moneySchema,
        to: moneySchema,
    }),
    steps: z.array(stepSchema),
});

const createAuthflowPolicySchema = z.object({
    action: z.string(),
    templates: z.array(templateSchema),
});

const buildApprover = (data: z.infer<typeof approverSchema>) =>
    Approver.create({
        name: Name.create(data.name).unwrap(),
        email: Email.create(data.email).unwrap(),
    }).unwrap();

const buildGroupTemplate = (data: z.infer<typeof groupSchema>) =>
    GroupTemplate.create({
        approvers: data.approvers.map(buildApprover),
    }).unwrap();

const buildStepTemplate = (data: z.infer<typeof stepSchema>) =>
    StepTemplate.create({
        order: Order.create(data.order).unwrap(),
        groups: data.groups.map(buildGroupTemplate),
    }).unwrap();

const buildTemplate = (data: z.infer<typeof templateSchema>) => {
    const from = Money.create(data.range.from.amount, data.range.from.currency).unwrap();
    const to = Money.create(data.range.to.amount, data.range.to.currency).unwrap();
    const range = Range.create(from, to).unwrap();
    return AuthflowTemplate.create({
        range,
        steps: data.steps.map(buildStepTemplate),
    }).unwrap();
};

export const createAuthflowPolicyRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post('/authflow-policies', async (request) => {
            const data = parse(createAuthflowPolicySchema, request.body);
            const result = await commands.createAuthflowPolicy.execute({
                action: data.action,
                templates: data.templates.map(buildTemplate),
            });
            return { data: result };
        });
    };
