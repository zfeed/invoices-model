import { Paypal } from '../../../../lib/paypal/paypal.ts';
import { Session } from '../../../building-blocks/unit-of-work/unit-of-work.ts';
import { CreatePayout } from './create-payout.activity.ts';
import { FetchPayoutStatus } from './fetch-payout-status.activity.ts';
import { PayInvoice } from './pay-invoice.activity.ts';
import { FailInvoice } from './fail-invoice.activity.ts';

export type Activities = {
    createPayout: CreatePayout['execute'];
    fetchPayoutStatus: FetchPayoutStatus['execute'];
    payInvoice: PayInvoice['execute'];
    failInvoice: FailInvoice['execute'];
};

export const buildActivities = (deps: {
    paypal: Paypal;
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
