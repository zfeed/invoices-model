import { PayPal } from '../../../paypal/api/paypal';
import { Session } from '../../../../shared/unit-of-work/unit-of-work';
import { CreatePayout } from './create-payout.activity';
import { FetchPayoutStatus } from './fetch-payout-status.activity';
import { PayInvoice } from './pay-invoice.activity';
import { FailInvoice } from './fail-invoice.activity';

export type Activities = {
    createPayout: CreatePayout['execute'];
    fetchPayoutStatus: FetchPayoutStatus['execute'];
    payInvoice: PayInvoice['execute'];
    failInvoice: FailInvoice['execute'];
};

export const buildActivities = (deps: {
    paypal: PayPal;
    session: Session;
}): Activities => {
    const createPayout = new CreatePayout(deps.paypal);
    const fetchPayoutStatus = new FetchPayoutStatus(deps.paypal);
    const payInvoice = new PayInvoice(deps.session);
    const failInvoice = new FailInvoice(deps.session);

    return {
        createPayout: createPayout.execute.bind(createPayout),
        fetchPayoutStatus: fetchPayoutStatus.execute.bind(fetchPayoutStatus),
        payInvoice: payInvoice.execute.bind(payInvoice),
        failInvoice: failInvoice.execute.bind(failInvoice),
    };
};
