import { ApplicationFailure } from '@temporalio/activity';
import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { Invoice } from '../../../invoices/domain/invoice/invoice';
import { Id } from '../../../invoices/domain/id/id';

export class PayInvoice {
    constructor(private session: Session) {}

    async execute(invoiceId: string): Promise<void> {
        await using uow = await this.session.begin();

        const invoice = await uow
            .collection(Invoice)
            .get(Id.fromString(invoiceId));

        if (!invoice) {
            throw ApplicationFailure.create({
                message: `Invoice ${invoiceId} not found`,
                type: 'InvoiceNotFound',
                nonRetryable: true,
            });
        }

        invoice.pay().unwrap();

        await uow.commit();
    }
}
