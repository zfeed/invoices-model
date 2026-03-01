import 'dotenv/config';
import { kysely } from './database/kysely';
import { v7 } from 'uuid';
import { unflatten } from './src/building-blocks';
import { DraftInvoice } from './src/core/invoices/domain/draft-invoice/draft-invoice';
import { selectDraftInvoice } from './draft-invoice';
const id = '019ca53e-c501-7008-99a2-74e4a58f9c5a';

async function main() {
    const entity = await selectDraftInvoice(id);

    console.log(1111);
    console.log(entity);
}

async function insert() {
    // await kysely
    //     .insertInto('draft_invoices')
    //     .values({
    //         id,
    //         status: 'DRAFT',
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     })
    //     .executeTakeFirst();
    //

    // await kysely
    //     .insertInto('draft_invoice_line_items')
    //     .values({
    //         id: v7(),
    //         description: 'Hey2',
    //         draft_invoice_id: id,
    //         price_amount: 200,
    //         total_amount: 200,
    //         total_currency: 'USD',
    //         quantity: 1,
    //         price_currency: 'USD',
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     })
    //     .executeTakeFirst();
    //
    //
    await kysely
        .insertInto('draft_invoice_paypal_billings')
        .values({
            id: v7(),
            email: 'exaple.com',
            draft_invoice_id: id,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .executeTakeFirst();
}

main();
