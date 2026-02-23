import { Equatable, Mappable, Result } from '../../../../building-blocks';
import { Email } from '../email/email';
import { Id } from '../id/id';
import { Name } from '../name/name';

export class Approver implements Equatable<Approver>, Mappable<ReturnType<Approver['toPlain']>> {
    #id: Id;
    #name: Name;
    #email: Email;

    protected constructor(id: Id, name: Name, email: Email) {
        this.#id = id;
        this.#name = name;
        this.#email = email;
    }

    public get id(): Id {
        return this.#id;
    }

    public get name(): Name {
        return this.#name;
    }

    public get email(): Email {
        return this.#email;
    }

    static create(data: { name: Name; email: Email }) {
        const id = Id.create().unwrap();
        return Result.ok(new Approver(id, data.name, data.email));
    }

    static fromPlain(plain: { id: string; name: string; email: string }) {
        return new Approver(
            Id.fromPlain(plain.id),
            Name.fromPlain(plain.name),
            Email.fromPlain(plain.email),
        );
    }

    equals(other: Approver): boolean {
        return this.#id.equals(other.#id);
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            name: this.#name.toPlain(),
            email: this.#email.toPlain(),
        };
    }

    toString(): string {
        return `${this.#name.toString()} <${this.#email.toString()}>`;
    }
}
