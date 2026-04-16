import { z } from 'zod';
import { ISSUER_TYPE } from '../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../domain/recipient/recipient.ts';

export const draftInvoiceSchema = z.object({
    lineItems: z
        .array(
            z.object({
                description: z.string().max(255),
                price: z.object({
                    amount: z.string().max(20),
                    currency: z.string().max(3),
                }),
                quantity: z.string().max(20),
            })
        )
        .optional(),
    vatRate: z.string().max(6).optional(),
    issueDate: z.string().max(10).optional(),
    dueDate: z.string().max(10).optional(),
    issuer: z
        .object({
            type: z.nativeEnum(ISSUER_TYPE),
            name: z.string().max(255),
            address: z.string().max(500),
            taxId: z.string().max(50),
            email: z.string().max(320),
        })
        .optional(),
    recipient: z
        .object({
            type: z.nativeEnum(RECIPIENT_TYPE),
            name: z.string().max(255),
            address: z.string().max(500),
            taxId: z.string().max(50),
            email: z.string().max(320),
            taxResidenceCountry: z.string().max(2),
            billing: z.object({
                type: z.literal('PAYPAL'),
                email: z.string().max(320),
            }),
        })
        .optional(),
});
