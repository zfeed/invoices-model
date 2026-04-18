import { ApiClient } from '../common/api-client.ts';
import { Path } from '../common/path.ts';

import {
    GetAccessTokenByClientCredentialsRequestBody,
    GetAccessTokenByClientCredentialsResponseBody,
    TerminateAccessTokenRequestBody,
} from './login.types.ts';

export class Login {
    constructor(public client: ApiClient) {}

    getAccessTokenByClientCredentials(
        body: GetAccessTokenByClientCredentialsRequestBody
    ) {
        const credentials = Buffer.from(
            `${body.clientId}:${body.clientSecret}`
        ).toString('base64');

        return this.client.post<GetAccessTokenByClientCredentialsResponseBody>({
            uri: {
                path: Path.create`v1/oauth2/token`,
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                authorization: `Basic ${credentials}`,
            },
            body: {
                grant_type: 'client_credentials',
            },
        });
    }

    terminateAccessToken(
        body: TerminateAccessTokenRequestBody,
        accessToken: string
    ) {
        return this.client.post({
            uri: {
                path: Path.create`v1/oauth2/token/terminate`,
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                authorization: `Bearer ${accessToken}`,
            },
            body,
        });
    }
}
