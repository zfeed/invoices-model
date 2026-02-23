import { APPLICATION_ERROR_CODE } from '../../../../../../building-blocks/errors/application/application-codes';
import { ApplicationError } from '../../../../../../building-blocks/errors/application/application.error';
import { CanApproverApprove } from '../../../../../financial-authorization/application/use-cases/queries/can-approver-approve';
import { Id } from '../../../../domain/id/id';
import { Invoice } from '../../../../domain/invoice/invoice';
import { DomainEvents } from '../../../../../shared/domain-events/domain-events.interface';
import { UnitOfWorkFactory } from '../../../unit-of-work/unit-of-work.interface';

export class PayInvoice {
    constructor(
        private readonly unitOfWorkFactory: UnitOfWorkFactory,
        private readonly domainEvents: DomainEvents,
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

        const invoice = await this.unitOfWorkFactory.start(
            async (unitOfWork) => {
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

                return invoice;
            }
        );

        await this.domainEvents.publishEvents(invoice);

        return invoice.toPlain();
    }
}
