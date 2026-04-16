import { Result } from '../../../../shared/result.ts';
import { Login } from '../login/login.ts';

type Credentials = {
    clientId: string;
    clientSecret: string;
};

const EXPIRY_BUFFER_SECONDS = 60;

export class TokenManager {
    private token: string | null = null;
    private expiresAt: number = 0;
    private pending: Promise<Result<Error, string>> | null = null;

    constructor(
        private readonly credentials: Credentials,
        private readonly login: Login
    ) {}

    async getAccessToken(): Promise<Result<Error, string>> {
        if (this.token && Date.now() < this.expiresAt) {
            return Result.ok(this.token);
        }

        if (this.pending) {
            return this.pending;
        }

        this.pending = this.refresh();

        try {
            return await this.pending;
        } finally {
            this.pending = null;
        }
    }

    private async refresh(): Promise<Result<Error, string>> {
        const result = await this.login.getAccessTokenByClientCredentials({
            ...this.credentials,
            grantType: 'client_credentials',
        });

        if (result.isError()) {
            return result as Result<Error, never>;
        }

        const response = result.unwrap();

        if (response.statusCode !== 200) {
            return Result.error(
                new Error(
                    `Failed to obtain access token: ${response.statusCode}`
                )
            );
        }

        this.token = response.body.access_token;
        this.expiresAt =
            Date.now() +
            (response.body.expires_in - EXPIRY_BUFFER_SECONDS) * 1000;

        return Result.ok(this.token);
    }
}
