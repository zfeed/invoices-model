import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Email } from '../email/email';
import { Id } from '../id/id';
import { Name } from '../name/name';

export class Approver
    implements Equatable<Approver>, Mappable<ReturnType<Approver['toPlain']>>
{
    protected _id: Id;
    protected _name: Name;
    protected _email: Email;

    protected constructor(id: Id, name: Name, email: Email) {
        this._id = id;
        this._name = name;
        this._email = email;
    }

    public get id(): Id {
        return this._id;
    }

    public get name(): Name {
        return this._name;
    }

    public get email(): Email {
        return this._email;
    }

    static create(data: { id?: Id; name: Name; email: Email }) {
        const id = data.id ?? Id.create().unwrap();
        return Result.ok(new Approver(id, data.name, data.email));
    }

    equals(other: Approver): boolean {
        return this._id.equals(other._id);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            name: this._name.toPlain(),
            email: this._email.toPlain(),
        };
    }

    toString(): string {
        return `${this._name.toString()} <${this._email.toString()}>`;
    }
}
