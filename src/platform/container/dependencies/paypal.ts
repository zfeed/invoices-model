import { Paypal } from '../../../lib/paypal/paypal.ts';
import { Config } from '../../../config.ts';

export const createPaypal = (config: Config): Paypal =>
    new Paypal({
        baseUrl: new URL(config.paypal.baseUrl),
        credentials: {
            clientId: config.paypal.credentials.clientId,
            clientSecret: config.paypal.credentials.clientSecret,
        },
    });
