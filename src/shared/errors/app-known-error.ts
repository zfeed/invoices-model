import { KNOWN_ERROR_CODE } from './known-error-codes.ts';

export class AppKnownError extends Error {
    code: KNOWN_ERROR_CODE;

    constructor({
        message,
        code,
    }: {
        message: string;
        code: KNOWN_ERROR_CODE;
    }) {
        super(message);
        this.code = code;
    }
}
