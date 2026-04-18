export type GetAccessTokenByClientCredentialsRequestBody = {
    clientId: string;
    clientSecret: string;
    grantType: 'client_credentials';
};

export type GetAccessTokenByClientCredentialsResponseBody = {
    access_token: string;
    scope: string;
    token_type: string;
    app_id: string;
    expires_in: number;
    nonce: string;
};

export type TerminateAccessTokenRequestBody = {
    token: string;
    tokenTypeHint: 'ACCESS_TOKEN';
    code?: string;
    refreshToken?: string;
    grantType?: 'authorization_code' | 'refresh_token' | 'client_credentials';
};
