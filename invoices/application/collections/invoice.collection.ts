import { Invoice } from '../../domain/invoice/invoice';
import { Collection } from './collection.interface';

export class InvoiceCollection implements Collection<Invoice> {
    #invoices: Map<string, Invoice> = new Map<string, Invoice>();

    public add(id: string, invoice: Invoice) {
        this.#invoices.set(id, invoice);
    }

    public remove(id: string) {
        this.#invoices.delete(id);
    }

    public get(id: string): Invoice | undefined {
        return this.#invoices.get(id);
    }
}
