import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Email } from '../email/email';
import { checkIssuerNonEmpty } from './checks/check-issuer-non-empty';

export enum ISSUER_TYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    COMPANY = 'COMPANY',
}

export class Issuer
    implements Equatable<Issuer>, Mappable<ReturnType<Issuer['toPlain']>>
{
    protected _type: ISSUER_TYPE;
    protected _name: string;
    protected _address: string;
    protected _taxId: string;
    protected _email: Email;

    protected constructor(
        type: ISSUER_TYPE,
        name: string,
        address: string,
        taxId: string,
        email: Email
    ) {
        this._type = type;
        this._name = name;
        this._address = address;
        this._taxId = taxId;
        this._email = email;
    }

    get type(): ISSUER_TYPE {
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

    equals(other: Issuer): boolean {
        return (
            this._type === other._type &&
            this._name === other._name &&
            this._address === other._address &&
            this._taxId === other._taxId &&
            this._email.equals(other._email)
        );
    }

    toPlain() {
        return {
            type: this._type,
            name: this._name,
            address: this._address,
            taxId: this._taxId,
            email: this._email.toPlain(),
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
        const nameError = checkIssuerNonEmpty('name', name);
        if (nameError) {
            return Result.error(nameError);
        }

        const addressError = checkIssuerNonEmpty('address', address);
        if (addressError) {
            return Result.error(addressError);
        }

        const taxIdError = checkIssuerNonEmpty('taxId', taxId);
        if (taxIdError) {
            return Result.error(taxIdError);
        }

        const emailResult = Email.create(email);

        if (emailResult.isError()) {
            return emailResult.error();
        }

        const issueEmail = emailResult.unwrap();

        return Result.ok(new Issuer(type, name, address, taxId, issueEmail));
    }
}
