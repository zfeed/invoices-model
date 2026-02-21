import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Country } from '../country/country';
import { Email } from '../email/email';
import { Paypal } from './billing/paypal';
import { Wire } from './billing/wire';

export enum RECIPIENT_TYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export class Recipient implements Equatable<Recipient>, Mappable<ReturnType<Recipient['toPlain']>> {
    #type: RECIPIENT_TYPE;
    #name: string;
    #address: string;
    #taxId: string;
    #email: Email;
    #taxResidenceCountry: Country;
    #billing: Paypal | Wire;

    protected constructor(
        type: RECIPIENT_TYPE,
        name: string,
        address: string,
        taxId: string,
        email: Email,
        taxResidenceCountry: Country,
        billing: Paypal | Wire
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

    get billing(): Paypal | Wire {
        return this.#billing;
    }

    equals(other: Recipient): boolean {
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

    toPlain() {
        return {
            type: this.#type,
            name: this.#name,
            address: this.#address,
            taxId: this.#taxId,
            email: this.#email.toString(),
            taxResidenceCountry: this.#taxResidenceCountry.toString(),
            billing: this.#billing.toPlain(),
        };
    }

    static fromPlain(plain: ReturnType<Recipient['toPlain']>) {
        const billing = plain.billing.type === 'PAYPAL'
            ? Paypal.fromPlain(plain.billing as ReturnType<Paypal['toPlain']>)
            : Wire.fromPlain(plain.billing as ReturnType<Wire['toPlain']>);

        return new this(
            plain.type,
            plain.name,
            plain.address,
            plain.taxId,
            Email.fromPlain(plain.email),
            Country.fromPlain(plain.taxResidenceCountry),
            billing,
        );
    }

    static create({
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
        billing: Paypal | Wire;
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
            new this(
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
