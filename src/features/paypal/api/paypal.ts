import { ApiClient } from './common/api-client';
import { Config } from './common/api-client';
import { Login } from './login/login';
import { Payouts } from './payouts/payouts';

export class PayPal {
    constructor(config: Config) {
        const client = new ApiClient(config);

        this.login = new Login(client);
        this.payouts = new Payouts(client);
    }

    login: Login;

    payouts: Payouts;
}
