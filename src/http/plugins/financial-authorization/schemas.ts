import { z } from 'zod';

export const approveActionSchema = z.object({
    action: z.string().max(10),
    approver: z.object({
        id: z.string().max(36),
        name: z.string().max(255),
        email: z.string().max(320),
    }),
});

export const approverSchema = z.object({
    name: z.string().max(255),
    email: z.string().max(320),
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
    amount: z.string().max(20),
    currency: z.string().max(3),
});

export const templateSchema = z.object({
    range: z.object({
        from: moneySchema,
        to: moneySchema,
    }),
    steps: z.array(stepSchema),
});

export const createAuthflowPolicySchema = z.object({
    action: z.string().max(10),
    templates: z.array(templateSchema),
});
