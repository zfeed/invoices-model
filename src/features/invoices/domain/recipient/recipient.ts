import { DomainError, Equatable, Mappable, Result } from '../../../../shared/index.ts';
import { checkRecipientNonEmpty } from './checks/check-recipient-non-empty.ts';
import { Country } from '../country/country.ts';
import { Email } from '../email/email.ts';
import { Paypal } from '../billing/paypal/paypal.ts';

export enum RECIPIENT_TYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export class Recipient
    implements Equatable<Recipient>, Mappable<ReturnType<Recipient['toPlain']>>
{
    protected _type: RECIPIENT_TYPE;
    protected _name: string;
    protected _address: string;
    protected _taxId: string;
    protected _email: Email;
    protected _taxResidenceCountry: Country;
    protected _billing: Paypal;

    protected constructor(
        type: RECIPIENT_TYPE,
        name: string,
        address: string,
        taxId: string,
        email: Email,
        taxResidenceCountry: Country,
        billing: Paypal
    ) {
        this._type = type;
        this._name = name;
        this._address = address;
        this._taxId = taxId;
        this._email = email;
        this._taxResidenceCountry = taxResidenceCountry;
        this._billing = billing;
    }

    get type(): RECIPIENT_TYPE {
        return this._type;
    }

    get name(): string {
        return this._name;
    }

    get address(): string {
        return this._address;
    }

    get taxId(): string {
        return this._taxId;
    }

    get email(): Email {
        return this._email;
    }

    get taxResidenceCountry(): Country {
        return this._taxResidenceCountry;
    }

    get billing(): Paypal {
        return this._billing;
    }

    equals(other: Recipient): boolean {
        return (
            this._type === other._type &&
            this._name === other._name &&
            this._address === other._address &&
            this._taxId === other._taxId &&
            this._email.equals(other._email) &&
            this._taxResidenceCountry.equals(other._taxResidenceCountry) &&
            this._billing.type === other._billing.type &&
            this._billing.equals(other._billing as any)
        );
    }

    toPlain() {
        return {
            type: this._type,
            name: this._name,
            address: this._address,
            taxId: this._taxId,
            email: this._email.toString(),
            taxResidenceCountry: this._taxResidenceCountry.toString(),
            billing: this._billing.toPlain(),
        };
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
        billing: Paypal;
    }): Result<DomainError, Recipient> {
        const fieldError =
            checkRecipientNonEmpty('name', name) ??
            checkRecipientNonEmpty('address', address) ??
            checkRecipientNonEmpty('taxId', taxId);

        if (fieldError) {
            return Result.error(fieldError);
        }

        const emailResult = Email.create(email);

        if (emailResult.isError()) {
            return emailResult;
        }

        const countryResult = Country.create(taxResidenceCountry);

        if (countryResult.isError()) {
            return countryResult;
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
