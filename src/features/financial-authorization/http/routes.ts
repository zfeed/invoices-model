import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../../../http/types.ts';
import { parse } from '../../../http/validation.ts';
import { Approver } from '../domain/approver/approver.ts';
import { Money } from '../domain/money/money.ts';
import { Range } from '../domain/range/range.ts';
import { Order } from '../domain/order/order.ts';
import { Name } from '../domain/name/name.ts';
import { Email } from '../domain/email/email.ts';
import { GroupTemplate } from '../domain/groups/group-template.ts';
import { StepTemplate } from '../domain/step/step-template.ts';
import { AuthflowTemplate } from '../domain/authflow/authflow-template.ts';
import {
    approveActionSchema,
    createAuthflowPolicySchema,
    approverSchema,
    groupSchema,
    stepSchema,
    templateSchema,
} from './schemas.ts';

// Helper functions
const buildApprover = (data: z.infer<typeof approverSchema>) =>
    Approver.create({
        name: Name.create(data.name).unwrap(),
        email: Email.create(data.email).unwrap(),
    }).unwrap();

const buildGroupTemplate = (data: z.infer<typeof groupSchema>) =>
    GroupTemplate.create({
        requiredApprovals: data.requiredApprovals,
        approvers: data.approvers.map(buildApprover),
    }).unwrap();

const buildStepTemplate = (data: z.infer<typeof stepSchema>) =>
    StepTemplate.create({
        order: Order.create(data.order).unwrap(),
        groups: data.groups.map(buildGroupTemplate),
    }).unwrap();

const buildTemplate = (data: z.infer<typeof templateSchema>) => {
    const from = Money.create(
        data.range.from.amount,
        data.range.from.currency
    ).unwrap();
    const to = Money.create(
        data.range.to.amount,
        data.range.to.currency
    ).unwrap();
    const range = Range.create(from, to).unwrap();
    return AuthflowTemplate.create({
        range,
        steps: data.steps.map(buildStepTemplate),
    }).unwrap();
};

// Route handlers
const createAuthflowPolicy =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post('/authflow-policies', async (request) => {
            const data = parse(createAuthflowPolicySchema, request.body);
            const result = await commands.createAuthflowPolicy.execute({
                action: data.action,
                templates: data.templates.map(buildTemplate),
            });
            return { data: result };
        });
    };

const approveActionOnDocument =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.post<{ Params: { referenceId: string } }>(
            '/documents/:referenceId/approve',
            async (request) => {
                const referenceId = request.params.referenceId;
                const data = parse(approveActionSchema, request.body);
                const result = await commands.approveActionOnDocument.execute({
                    referenceId,
                    action: data.action,
                    approverId: data.approverId,
                });
                return { data: result };
            }
        );
    };

const canApproverApprove =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.get<{
            Params: { referenceId: string };
            Querystring: { approverId: string; action: string };
        }>('/documents/:referenceId/can-approve', async (request) => {
            const { referenceId } = request.params;
            const { approverId, action } = request.query;
            const answer = await commands.canApproverApprove
                .can(approverId)
                .perform(action)
                .on(referenceId)
                .ask();
            return { data: { answer } };
        });
    };

// Main plugin to register all financial authorization routes
export const financialAuthorizationPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createAuthflowPolicy(commands));
        await app.register(approveActionOnDocument(commands));
        await app.register(canApproverApprove(commands));
    };
