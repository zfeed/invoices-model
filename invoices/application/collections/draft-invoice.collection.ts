import { DraftInvoice } from '../../domain/draft-invoice/draft-invoice';
import { Collection } from './collection.interface';

export class DraftInvoiceCollection implements Collection<DraftInvoice> {
    #draftInvoices: Map<string, DraftInvoice> = new Map<string, DraftInvoice>();

    public add(id: string, draftInvoice: DraftInvoice) {
        this.#draftInvoices.set(id, draftInvoice);
    }

    public remove(id: string) {
        this.#draftInvoices.delete(id);
    }

    public get(id: string): DraftInvoice | undefined {
        return this.#draftInvoices.get(id);
    }
}
