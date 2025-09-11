import { DOMAIN_ERROR_CODE } from "./codes";

export class DomainError extends Error {
    code: DOMAIN_ERROR_CODE;

    constructor({
        message,
        code,
    }: {
        message: string;
        code: DOMAIN_ERROR_CODE;
    }) {
        super(message);
        this.code = code;
    }
}