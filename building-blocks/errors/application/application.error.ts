import { APPLICATION_ERROR_CODE } from './application-codes';

export class ApplicationError extends Error {
    code: APPLICATION_ERROR_CODE;

    constructor({
        message,
        code,
    }: {
        message: string;
        code: APPLICATION_ERROR_CODE;
    }) {
        super(message);
        this.code = code;
    }
}
