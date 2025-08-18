import { Invoice } from "./invoices/invoice/invoice";
import { Vat } from "./invoices/vat/vat";

function main() {
    const invoice = Invoice.create("100", "USD");

    const vat = Vat.fromPercent("20");

    invoice.applyVat(vat);
}

main();
