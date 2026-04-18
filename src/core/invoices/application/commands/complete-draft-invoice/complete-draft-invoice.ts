import { KNOWN_ERROR_CODE } from '../../../../building-blocks/errors/known-error-codes.ts';
import { AppKnownError } from '../../../../building-blocks/errors/app-known-error.ts';
import { DraftInvoice } from '../../../domain/draft-invoice/draft-invoice.ts';
import { Id } from '../../../domain/id/id.ts';
import { Invoice } from '../../../domain/invoice/invoice.ts';
import { Session } from '../../../../building-blocks/unit-of-work/unit-of-work.ts';
import { InvoiceDto } from '../../queries/get-invoice/invoice.dto.ts';

export class CompleteDraftInvoice {
    constructor(private readonly session: Session) {}

    public async execute(id: string) {
        await using unitOfWork = await this.session.begin();

        const draftInvoice = await unitOfWork
            .collection(DraftInvoice)
            .get(Id.fromString(id));

        if (!draftInvoice) {
            throw new AppKnownError({
                message: 'Draft invoice not found',
                code: KNOWN_ERROR_CODE.ITEM_NOT_FOUND,
            });
        }

        const invoice = draftInvoice.toInvoice().unwrap();

        await unitOfWork.collection(Invoice).add(invoice);

        await unitOfWork.commit();

        return InvoiceDto.fromInvoice(invoice);
    }
}
