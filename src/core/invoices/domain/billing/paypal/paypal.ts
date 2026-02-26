import { Equatable, Mappable, Result } from '../../../../../building-blocks';
import { Email } from '../../email/email';
import { IBilling } from '../billing.interface';

export class Paypal
    implements
        Equatable<Paypal>,
        IBilling<'PAYPAL', { email: Email }>,
        Mappable<ReturnType<Paypal['toPlain']>>
{
    public readonly type = 'PAYPAL' as const;
    public readonly data: { email: Email };

    protected constructor(data: { email: Email }) {
        this.data = data;
    }

    equals(other: Paypal): boolean {
        return this.data.email.equals(other.data.email);
    }

    toPlain() {
        return { type: this.type, data: { email: this.data.email.toString() } };
    }

    static fromPlain(plain: ReturnType<Paypal['toPlain']>) {
        return new Paypal({ email: Email.fromPlain(plain.data.email) });
    }

    static create(data: { email: string }) {
        const emailResult = Email.create(data.email);

        if (emailResult.isError()) {
            return emailResult;
        }

        return Result.ok(new Paypal({ email: emailResult.unwrap() }));
    }
}
