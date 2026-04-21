import { authflowPolicyPersister } from '../../../core/financial-authorization/infrastructure/authflow-policy.persister.ts';
import { financialDocumentPersister } from '../../../core/financial-authorization/infrastructure/financial-document.persister.ts';
import { DraftInvoicePersister } from '../../../core/invoices/infrastructure/draft-invoice.persister.ts';
import { InvoicePersister } from '../../../core/invoices/infrastructure/invoice.persister.ts';
import type { EntityPersister } from './entity-persister.ts';

export const defaultPersisters: EntityPersister<unknown>[] = [
    new DraftInvoicePersister(),
    new InvoicePersister(),
    financialDocumentPersister,
    authflowPolicyPersister,
];
