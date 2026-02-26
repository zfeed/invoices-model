import { APPLICATION_ERROR_CODE } from '../../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../../building-blocks/errors/application/application.error';
import { Id } from '../../../domain/id/id';
import { Invoice } from '../../../domain/invoice/invoice';
import { DomainEvents } from '../../../../shared/domain-events/domain-events.interface';
import { Session } from '../../../../shared/unit-of-work/unit-of-work.interface';

export class CancelInvoice {
    constructor(
        private readonly session: Session,
        private readonly domainEvents: DomainEvents
    ) {}

    public async execute(id: string) {
        const invoice = await this.session.start(async (unitOfWork) => {
            const invoice = await unitOfWork
                .collection(Invoice)
                .get(Id.fromString(id));

            if (!invoice) {
                throw new ApplicationError({
                    message: 'Invoice not found',
                    code: APPLICATION_ERROR_CODE.ITEM_NOT_FOUND,
                });
            }

            invoice.cancel().unwrap();

            return invoice;
        });

        await this.domainEvents.publishEvents(invoice);

        return invoice.toPlain();
    }
}
