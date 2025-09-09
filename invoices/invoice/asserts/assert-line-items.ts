import { LineItem } from "../../line-item/line-item"; // Adjust the import path based on where LineItem is defined

export class InvalidLineItemsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidLineItemsError";
    }
}

export function assertLineItems(lineItems: LineItem[]): void {
    if (!Array.isArray(lineItems)) {
        throw new InvalidLineItemsError("Line items must be an array");
    }

    if (lineItems.length === 0) {
        throw new InvalidLineItemsError(
            "Invoice must have at least one line item"
        );
    }

    if (lineItems.length > 0) {
        const firstCurrency = lineItems[0].price.currency;

        if (
            !lineItems.every((item) =>
                item.price.currency.equals(firstCurrency)
            )
        ) {
            throw new InvalidLineItemsError(
                "All line items must have the same currency"
            );
        }
    }

    for (let i = 0; i < lineItems.length; i++) {
        for (let j = i + 1; j < lineItems.length; j++) {
            if (lineItems[i].equals(lineItems[j])) {
                throw new InvalidLineItemsError("Duplicate line item");
            }
        }
    }
}
