import { z } from 'zod';

export const approveActionSchema = z.object({
    action: z.string(),
    approver: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
    }),
});

export const approverSchema = z.object({
    name: z.string(),
    email: z.string(),
});

export const groupSchema = z.object({
    requiredApprovals: z.number(),
    approvers: z.array(approverSchema),
});

export const stepSchema = z.object({
    order: z.number(),
    groups: z.array(groupSchema),
});

export const moneySchema = z.object({
    amount: z.string(),
    currency: z.string(),
});

export const templateSchema = z.object({
    range: z.object({
        from: moneySchema,
        to: moneySchema,
    }),
    steps: z.array(stepSchema),
});

export const createAuthflowPolicySchema = z.object({
    action: z.string(),
    templates: z.array(templateSchema),
});
