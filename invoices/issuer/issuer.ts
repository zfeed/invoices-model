import { Result } from "../../building-blocks";
import { Email } from "../email/email";

export class Issuer {
    #name: string;
    #address: string;
    #taxId: string;
    #email: Email;

    private constructor(
        name: string,
        address: string,
        taxId: string,
        email: Email
    ) {
        this.#name = name;
        this.#address = address;
        this.#taxId = taxId;
        this.#email = email;
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
            this.#name === other.#name &&
            this.#address === other.#address &&
            this.#taxId === other.#taxId &&
            this.#email.equals(other.#email)
        );
    }

    static create({
        name,
        address,
        taxId,
        email
    }: {
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


        return Result.ok(
            new this(
                name,
                address,
                taxId,
                issueEmail
            )
        );
    }
}