import { z } from 'zod';

export const payInvoiceSchema = z.object({
    approverId: z.string(),
});
