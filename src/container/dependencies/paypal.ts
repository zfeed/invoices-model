import { Paypal } from '../../features/paypal/api/paypal';
import { config } from '../../config';

export const createPaypal = (): Paypal =>
    new Paypal({
        baseUrl: new URL(config.paypal.baseUrl),
        credentials: {
            clientId: config.paypal.credentials.clientId,
            clientSecret: config.paypal.credentials.clientSecret,
        },
    });
