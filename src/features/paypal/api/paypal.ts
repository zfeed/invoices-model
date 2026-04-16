import { ApiClient, Config } from './common/api-client.ts';
import { TokenManager } from './common/token-manager.ts';
import { Login } from './login/login.ts';
import { Payouts } from './payouts/payouts.ts';

type Credentials = {
    clientId: string;
    clientSecret: string;
};

export class Paypal {
    login: Login;
    payouts: Payouts;

    constructor(config: Config & { credentials: Credentials }) {
        const client = new ApiClient(config);

        this.login = new Login(client);

        const tokenManager = new TokenManager(config.credentials, this.login);

        this.payouts = new Payouts(client, tokenManager);
    }
}
