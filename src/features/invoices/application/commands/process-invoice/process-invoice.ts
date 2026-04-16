import { APPLICATION_ERROR_CODE } from '../../../../../shared/errors/application/application-codes.ts';
import { ApplicationError } from '../../../../../shared/errors/application/application.error.ts';
import { Id } from '../../../domain/id/id.ts';
import { Invoice } from '../../../domain/invoice/invoice.ts';
import { Session } from '../../../../../shared/unit-of-work/unit-of-work.ts';
import { InvoiceDto } from '../../queries/get-invoice/invoice.dto.ts';

export class ProcessInvoice {
    constructor(private readonly session: Session) {}

    public async execute(id: string) {
        await using unitOfWork = await this.session.begin();

        const invoice = await unitOfWork
            .collection(Invoice)
            .get(Id.fromString(id));

        if (!invoice) {
            throw new ApplicationError({
                message: 'Invoice not found',
                code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        invoice.process().unwrap();

        await unitOfWork.commit();

        return InvoiceDto.fromInvoice(invoice);
    }
}
