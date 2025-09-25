import { Recipient, RECIPIENT_TYPE } from './recipient';
import { Email } from '../email/email';
import { Country } from '../country/country';
import { Paypal } from './billing/paypal';

describe('Recipient', () => {
    it('should create an individual recipient', () => {
        const billingResult = Paypal.create({
            email: 'billing@company.com',
        }).unwrap();

        const result = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'John Doe',
            taxResidenceCountry: 'US',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
            billing: billingResult,
        });

        const recipient = result.unwrap();

        expect(recipient.address).toBe('123 Main St, City, Country');
        expect(
            recipient.email.equals(Email.create('info@company.com').unwrap())
        ).toBe(true);
        expect(recipient.name).toBe('John Doe');
        expect(recipient.taxId).toBe('TAX123456');
        expect(recipient.type).toBe('INDIVIDUAL');
        expect(
            recipient.taxResidenceCountry.equals(
                Country.create({ code: 'US' }).unwrap()
            )
        ).toBe(true);
        expect(recipient.billing.type).toBe('PAYPAL');
    });
});
