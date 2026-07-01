import { z } from 'zod';

export const invoiceIdParamSchema = z.object({
    id: z.string(),
});

export const payInvoiceSchema = z.object({
    approverId: z.string().max(36),
});

export const lineItemDtoSchema = z.object({
    id: z.string(),
    description: z.string(),
    priceAmount: z.string(),
    priceCurrency: z.string(),
    quantity: z.string(),
    totalAmount: z.string(),
    totalCurrency: z.string(),
});

export const issuerDtoSchema = z.object({
    type: z.string(),
    name: z.string(),
    address: z.string(),
    taxId: z.string(),
    email: z.string(),
});

export const recipientDtoSchema = z.object({
    type: z.string(),
    name: z.string(),
    address: z.string(),
    taxId: z.string(),
    email: z.string(),
    taxResidenceCountry: z.string(),
    paypalEmail: z.string().nullable(),
});

export const invoiceDtoSchema = z.object({
    id: z.string(),
    status: z.string(),
    subtotalAmount: z.string(),
    subtotalCurrency: z.string(),
    totalAmount: z.string(),
    totalCurrency: z.string(),
    vatRate: z.string().nullable(),
    vatAmount: z.string().nullable(),
    vatCurrency: z.string().nullable(),
    issueDate: z.string(),
    dueDate: z.string(),
    issuer: issuerDtoSchema,
    recipient: recipientDtoSchema,
    lineItems: z.array(lineItemDtoSchema),
});
