import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';
import { CanApproverApprove } from '../../../../financial-authorization/application/queries/can-approver-approve.ts';
import { Id } from '../../../domain/id/id.ts';
import { Invoice } from '../../../domain/invoice/invoice.ts';
import { Session } from '../../../../building-blocks/unit-of-work/unit-of-work.ts';
import { InvoiceDto } from '../../queries/get-invoice/invoice.dto.ts';

export class PayInvoice {
    constructor(
        private readonly session: Session,
        private readonly canApproverApprove: CanApproverApprove
    ) {}

    public async execute(request: { id: string; approverId: string }) {
        const answer = await this.canApproverApprove
            .can(request.approverId)
            .perform('pay')
            .on(request.id)
            .ask();

        if (answer !== 'YES') {
            throw new AppKnownError({
                message: 'Payment not authorized',
                code: KNOWN_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
            });
        }

        await using unitOfWork = await this.session.begin();

        const invoice = await unitOfWork
            .collection(Invoice)
            .get(Id.fromString(request.id));

        if (!invoice) {
            throw new AppKnownError({
                message: 'Invoice not found',
                code: KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        invoice.pay().unwrap();

        await unitOfWork.commit();

        return InvoiceDto.fromInvoice(invoice);
    }
}
