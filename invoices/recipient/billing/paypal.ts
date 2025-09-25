import { IBilling } from './billing.interface';
import { Email } from '../../email/email';
import { Result } from '../../../building-blocks';

export class Paypal implements IBilling<'PAYPAL', { email: Email }> {
    public readonly type = 'PAYPAL' as const;
    public readonly data: { email: Email };

    private constructor(data: { email: Email }) {
        this.data = data;
    }

    static create(data: { email: string }) {
        const emailResult = Email.create(data.email);

        if (emailResult.isError()) {
            return emailResult;
        }

        return Result.ok(new Paypal({ email: emailResult.unwrap() }));
    }
}
