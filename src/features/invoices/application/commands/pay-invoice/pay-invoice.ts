import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes';
import { ApplicationError } from '../../../../../shared/errors/application/application.error';
import { CanApproverApprove } from '../../../../financial-authorization/application/queries/can-approver-approve';
import { Id } from '../../../domain/id/id';
import { Invoice } from '../../../domain/invoice/invoice';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work';
import { InvoiceDto } from '../../queries/get-invoice/invoice.dto';

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
            throw new ApplicationError({
                message: 'Payment not authorized',
                code: APPLICATION_ERROR_CODE.PAYMENT_NOT_AUTHORIZED,
            });
        }

        await using unitOfWork = await this.session.begin();

        const invoice = await unitOfWork
            .collection(Invoice)
            .get(Id.fromString(request.id));

        if (!invoice) {
            throw new ApplicationError({
                message: 'Invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        invoice.pay().unwrap();

        await unitOfWork.commit();

        return InvoiceDto.fromInvoice(invoice);
    }
}
