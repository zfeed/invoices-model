export type GetAccessTokenByClientCredentialsRequestBody = {
    clientId: string;
    clientSecret: string;
    grantType: 'client_credentials';
};

export type GetAccessTokenByClientCredentialsResponseBody = {
    accessToken: string;
    scope: string;
    tokenType: string;
    appId: string;
    expiresIn: number;
    nonce: string;
};

export type TerminateAccessTokenRequestBody = {
    token: string;
    tokenTypeHint: 'ACCESS_TOKEN';
    code?: string;
    refreshToken?: string;
    grantType?: 'authorization_code' | 'refresh_token' | 'client_credentials';
};
