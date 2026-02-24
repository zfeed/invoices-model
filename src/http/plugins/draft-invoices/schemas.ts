import { z } from 'zod';
import { ISSUER_TYPE } from '../../../core/invoices/domain/issuer/issuer';
import { RECIPIENT_TYPE } from '../../../core/invoices/domain/recipient/recipient';

export const draftInvoiceSchema = z.object({
    lineItems: z
        .array(
            z.object({
                description: z.string(),
                price: z.object({ amount: z.string(), currency: z.string() }),
                quantity: z.string(),
            })
        )
        .optional(),
    vatRate: z.string().optional(),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    issuer: z
        .object({
            type: z.nativeEnum(ISSUER_TYPE),
            name: z.string(),
            address: z.string(),
            taxId: z.string(),
            email: z.string(),
        })
        .optional(),
    recipient: z
        .object({
            type: z.nativeEnum(RECIPIENT_TYPE),
            name: z.string(),
            address: z.string(),
            taxId: z.string(),
            email: z.string(),
            taxResidenceCountry: z.string(),
            billing: z.discriminatedUnion('type', [
                z.object({ type: z.literal('PAYPAL'), email: z.string() }),
                z.object({
                    type: z.literal('WIRE'),
                    swift: z.string(),
                    accountNumber: z.string(),
                    accountHolderName: z.string(),
                    bankName: z.string(),
                    bankAddress: z.string(),
                    bankCountry: z.string(),
                }),
            ]),
        })
        .optional(),
});
