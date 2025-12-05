import { testEquatable } from '../../../building-blocks/equatable.test-helper';
import { Country } from '../country/country';
import { Email } from '../email/email';
import { Paypal } from './billing/paypal';
import { Recipient, RECIPIENT_TYPE } from './recipient';

describe('Recipient', () => {
    testEquatable({
        typeName: 'Recipient',
        createEqual: () => {
            const billing = Paypal.create({
                email: 'billing@company.com',
            }).unwrap();
            return [
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'John Doe',
                    taxResidenceCountry: 'US',
                    address: '123 Main St',
                    taxId: 'TAX123',
                    email: 'info@company.com',
                    billing: billing,
                }).unwrap(),
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'John Doe',
                    taxResidenceCountry: 'US',
                    address: '123 Main St',
                    taxId: 'TAX123',
                    email: 'info@company.com',
                    billing: billing,
                }).unwrap(),
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'John Doe',
                    taxResidenceCountry: 'US',
                    address: '123 Main St',
                    taxId: 'TAX123',
                    email: 'info@company.com',
                    billing: billing,
                }).unwrap(),
            ];
        },
        createDifferent: () => {
            const billing1 = Paypal.create({
                email: 'billing1@company.com',
            }).unwrap();
            const billing2 = Paypal.create({
                email: 'billing2@company.com',
            }).unwrap();
            return [
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'John Doe',
                    taxResidenceCountry: 'US',
                    address: '123 Main St',
                    taxId: 'TAX123',
                    email: 'info@company.com',
                    billing: billing1,
                }).unwrap(),
                Recipient.create({
                    type: RECIPIENT_TYPE.INDIVIDUAL,
                    name: 'Jane Smith',
                    taxResidenceCountry: 'CA',
                    address: '456 Oak Ave',
                    taxId: 'TAX456',
                    email: 'jane@company.com',
                    billing: billing2,
                }).unwrap(),
            ];
        },
    });

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
