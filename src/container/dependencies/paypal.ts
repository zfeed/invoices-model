import { Paypal } from '../../features/paypal/api/paypal.ts';
import { config } from '../../config.ts';

export const createPaypal = (): Paypal =>
    new Paypal({
        baseUrl: new URL(config.paypal.baseUrl),
        credentials: {
            clientId: config.paypal.credentials.clientId,
            clientSecret: config.paypal.credentials.clientSecret,
        },
    });
