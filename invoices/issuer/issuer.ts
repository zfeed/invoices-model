import { Result } from '../../building-blocks';
import { Email } from '../email/email';

export enum ISSUER_TYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export class Issuer {
    #type: ISSUER_TYPE;
    #name: string;
    #address: string;
    #taxId: string;
    #email: Email;

    private constructor(
        type: ISSUER_TYPE,
        name: string,
        address: string,
        taxId: string,
        email: Email
    ) {
        this.#type = type;
        this.#name = name;
        this.#address = address;
        this.#taxId = taxId;
        this.#email = email;
    }

    get type(): ISSUER_TYPE {
        return this.#type;
    }

    get name(): string {
        return this.#name;
    }

    get address(): string {
        return this.#address;
    }

    get taxId(): string {
        return this.#taxId;
    }

    get email(): Email {
        return this.#email;
    }

    equals(other: Issuer): boolean {
        return (
            this.#type === other.#type &&
            this.#name === other.#name &&
            this.#address === other.#address &&
            this.#taxId === other.#taxId &&
            this.#email.equals(other.#email)
        );
    }

    toPlain() {
        return {
            type: this.#type,
            name: this.#name,
            address: this.#address,
            taxId: this.#taxId,
            email: this.#email.toString(),
        };
    }

    static create({
        type,
        name,
        address,
        taxId,
        email,
    }: {
        type: ISSUER_TYPE;
        name: string;
        address: string;
        taxId: string;
        email: string;
    }) {
        const emailResult = Email.create(email);

        if (emailResult.isError()) {
            return emailResult.error();
        }

        const issueEmail = emailResult.unwrap();

        return Result.ok(new this(type, name, address, taxId, issueEmail));
    }
}
