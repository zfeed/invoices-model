import { Result } from '../../building-blocks';
import { Email } from '../email/email';
import { Country } from '../country/country';
import { IBilling } from './billing/billing.interface';

export enum RECIPIENT_TYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export class Recipient<T, D, B extends IBilling<T, D>> {
    #type: RECIPIENT_TYPE;
    #name: string;
    #address: string;
    #taxId: string;
    #email: Email;
    #taxResidenceCountry: Country;
    #billing: B;

    private constructor(
        type: RECIPIENT_TYPE,
        name: string,
        address: string,
        taxId: string,
        email: Email,
        taxResidenceCountry: Country,
        billing: B
    ) {
        this.#type = type;
        this.#name = name;
        this.#address = address;
        this.#taxId = taxId;
        this.#email = email;
        this.#taxResidenceCountry = taxResidenceCountry;
        this.#billing = billing;
    }

    get type(): RECIPIENT_TYPE {
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

    get taxResidenceCountry(): Country {
        return this.#taxResidenceCountry;
    }

    get billing(): B {
        return this.#billing;
    }

    equals(other: Recipient<T, D, B>): boolean {
        return (
            this.#type === other.#type &&
            this.#name === other.#name &&
            this.#address === other.#address &&
            this.#taxId === other.#taxId &&
            this.#email.equals(other.#email) &&
            this.#taxResidenceCountry.equals(other.#taxResidenceCountry) &&
            this.#billing === other.#billing
        );
    }

    static create<T, D, B extends IBilling<T, D>>({
        type,
        name,
        address,
        taxId,
        email,
        taxResidenceCountry,
        billing,
    }: {
        type: RECIPIENT_TYPE;
        name: string;
        address: string;
        taxId: string;
        email: string;
        taxResidenceCountry: string;
        billing: B;
    }) {
        const emailResult = Email.create(email);

        if (emailResult.isError()) {
            return emailResult.error();
        }

        const countryResult = Country.create({ code: taxResidenceCountry });

        if (countryResult.isError()) {
            return countryResult.error();
        }

        const recipientEmail = emailResult.unwrap();
        const recipientCountry = countryResult.unwrap();

        return Result.ok(
            new this<T, D, B>(
                type,
                name,
                address,
                taxId,
                recipientEmail,
                recipientCountry,
                billing
            )
        );
    }
}
