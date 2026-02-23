import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../types';
import { parse } from '../validation';
import { createMoney } from '../../core/financial-authorization/domain/money/money';
import { createRange } from '../../core/financial-authorization/domain/range/range';
import { createOrder } from '../../core/financial-authorization/domain/order/order';
import { createName } from '../../core/financial-authorization/domain/name/name';
import { createEmail } from '../../core/financial-authorization/domain/email/email';
import { createApprover } from '../../core/financial-authorization/domain/approver/approver';
import { createGroupTemplate } from '../../core/financial-authorization/domain/groups/group-template';
import { createStepTemplate } from '../../core/financial-authorization/domain/step/step-template';
import { createAuthflowTemplate } from '../../core/financial-authorization/domain/authflow/authflow-template';

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
    createApprover({
        name: createName(data.name).unwrap(),
        email: createEmail(data.email).unwrap(),
    }).unwrap();

const buildGroupTemplate = (data: z.infer<typeof groupSchema>) =>
    createGroupTemplate({
        approvers: data.approvers.map(buildApprover),
    }).unwrap();

const buildStepTemplate = (data: z.infer<typeof stepSchema>) =>
    createStepTemplate({
        order: createOrder(data.order).unwrap(),
        groups: data.groups.map(buildGroupTemplate),
    }).unwrap();

const buildTemplate = (data: z.infer<typeof templateSchema>) => {
    const from = createMoney(data.range.from.amount, data.range.from.currency).unwrap();
    const to = createMoney(data.range.to.amount, data.range.to.currency).unwrap();
    const range = createRange(from, to).unwrap();
    return createAuthflowTemplate({
        range,
        steps: data.steps.map(buildStepTemplate),
    }).unwrap();
};

export const createAuthflowPolicyRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post('/authflow-policies', async (request) => {
            const data = parse(createAuthflowPolicySchema, request.body);
            const result = await commands.createAuthflowPolicy({
                action: data.action,
                templates: data.templates.map(buildTemplate),
            });
            return { data: result };
        });
    };
