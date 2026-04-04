import { ApiClient, Config } from './common/api-client';
import { TokenManager } from './common/token-manager';
import { Login } from './login/login';
import { Payouts } from './payouts/payouts';

type Credentials = {
    clientId: string;
    clientSecret: string;
};

export class PayPal {
    login: Login;
    payouts: Payouts;

    constructor(config: Config & { credentials: Credentials }) {
        const client = new ApiClient(config);

        this.login = new Login(client);

        const tokenManager = new TokenManager(config.credentials, this.login);

        this.payouts = new Payouts(client, tokenManager);
    }
}
