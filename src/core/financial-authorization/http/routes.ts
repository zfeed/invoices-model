import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Commands } from '../../../platform/http/types.ts';
import {
    dataResponse,
    errorResponses,
    errorResponsesFor,
} from '../../../platform/http/response.ts';
import { KNOWN_ERROR_CODE } from '../../building-blocks/errors/known-error-codes.ts';
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
    authflowPolicyDtoSchema,
    canApproveQuerySchema,
    canApproveResponseSchema,
    createAuthflowPolicySchema,
    approverSchema,
    documentDtoSchema,
    groupSchema,
    referenceIdParamSchema,
    stepSchema,
    templateSchema,
} from './schemas.ts';

const tags = ['authorization'];

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
        app.withTypeProvider<ZodTypeProvider>().post(
            '/authflow-policies',
            {
                schema: {
                    tags,
                    body: createAuthflowPolicySchema,
                    response: {
                        200: dataResponse(authflowPolicyDtoSchema),
                        ...errorResponsesFor(
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NAME_BLANK,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_EMAIL_INVALID_FORMAT,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_NEGATIVE,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_STEP_ORDER_DUPLICATE,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_INTEGER,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_AMOUNT_NOT_GTE_ZERO,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_MONEY_CURRENCY_NOT_ISO_4217,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_CURRENCIES_NOT_EQUAL,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_RANGE_FROM_GREATER_THAN_TO,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_POLICY_RANGES_OVERLAP
                        ),
                    },
                },
            },
            async (request) => {
                const result = await commands.createAuthflowPolicy.execute({
                    action: request.body.action,
                    templates: request.body.templates.map(buildTemplate),
                });
                return { data: result };
            }
        );
    };

const approveActionOnDocument =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().post(
            '/documents/:referenceId/approve',
            {
                schema: {
                    tags,
                    params: referenceIdParamSchema,
                    body: approveActionSchema,
                    response: {
                        200: dataResponse(documentDtoSchema),
                        ...errorResponsesFor(
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_REFERENCE_ID_BLANK,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_DOCUMENT_NOT_FOUND,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_NO_PENDING_STEPS,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_GROUP_NOT_FOUND,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_EMPTY,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVERS_DUPLICATE,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVER_NOT_FOUND,
                            KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_APPROVALS_DUPLICATE
                        ),
                    },
                },
            },
            async (request) => {
                const result = await commands.approveActionOnDocument.execute({
                    referenceId: request.params.referenceId,
                    action: request.body.action,
                    approverId: request.body.approverId,
                });
                return { data: result };
            }
        );
    };

const canApproverApprove =
    (commands: Commands) => async (app: FastifyInstance) => {
        app.withTypeProvider<ZodTypeProvider>().get(
            '/documents/:referenceId/can-approve',
            {
                schema: {
                    tags,
                    params: referenceIdParamSchema,
                    querystring: canApproveQuerySchema,
                    response: {
                        200: dataResponse(canApproveResponseSchema),
                        ...errorResponses,
                    },
                },
            },
            async (request) => {
                const { referenceId } = request.params;
                const { approverId, action } = request.query;
                const answer = await commands.canApproverApprove
                    .can(approverId)
                    .perform(action)
                    .on(referenceId)
                    .ask();
                return { data: { answer } };
            }
        );
    };

// Main plugin to register all financial authorization routes
export const financialAuthorizationPlugin =
    (commands: Commands) => async (app: FastifyInstance) => {
        await app.register(createAuthflowPolicy(commands));
        await app.register(approveActionOnDocument(commands));
        await app.register(canApproverApprove(commands));
    };
