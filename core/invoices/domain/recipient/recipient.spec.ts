import { testEquatable } from '../../../../building-blocks/equatable.test-helper';
import { Country } from '../country/country';
import { Email } from '../email/email';
import { Paypal } from '../billing/paypal/paypal';
import { Wire } from '../billing/wire/wire';
import { Recipient, RECIPIENT_TYPE } from './recipient';

describe('Recipient', () => {
    testEquatable({
        typeName: 'Recipient',
        createEqual: () => [
            Recipient.create({
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'John Doe',
                taxResidenceCountry: 'US',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
                billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
            }).unwrap(),
            Recipient.create({
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'John Doe',
                taxResidenceCountry: 'US',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
                billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
            }).unwrap(),
            Recipient.create({
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'John Doe',
                taxResidenceCountry: 'US',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
                billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
            }).unwrap(),
        ],
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
                Country.create('US').unwrap()
            )
        ).toBe(true);
        expect(recipient.billing.type).toBe('PAYPAL');
    });

    it('should create a recipient with wire billing', () => {
        const billing = Wire.create({
            swift: 'DEUTDEFF',
            accountNumber: 'DE89370400440532013000',
            accountHolderName: 'John Doe',
            bankName: 'Deutsche Bank',
            bankAddress: 'Taunusanlage 12, 60325 Frankfurt',
            bankCountry: 'DE',
        }).unwrap();

        const result = Recipient.create({
            type: RECIPIENT_TYPE.COMPANY,
            name: 'Acme Corp',
            taxResidenceCountry: 'DE',
            address: '456 Berlin St',
            taxId: 'DE123456789',
            email: 'info@acme.com',
            billing,
        });

        const recipient = result.unwrap();

        expect(recipient.billing.type).toBe('WIRE');
        expect(recipient.type).toBe('COMPANY');
    });

    it('should fail with empty name', () => {
        const result = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: '',
            taxResidenceCountry: 'US',
            address: '123 Main St',
            taxId: 'TAX123',
            email: 'info@company.com',
            billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '14000' }),
        );
    });

    it('should fail with empty address', () => {
        const result = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'John Doe',
            taxResidenceCountry: 'US',
            address: '  ',
            taxId: 'TAX123',
            email: 'info@company.com',
            billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '14000' }),
        );
    });

    it('should fail with empty taxId', () => {
        const result = Recipient.create({
            type: RECIPIENT_TYPE.INDIVIDUAL,
            name: 'John Doe',
            taxResidenceCountry: 'US',
            address: '123 Main St',
            taxId: '',
            email: 'info@company.com',
            billing: Paypal.create({ email: 'billing@company.com' }).unwrap(),
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '14000' }),
        );
    });

    it('should serialize to plain and reconstruct via fromPlain', () => {
        const billing = Wire.create({
            swift: 'DEUTDEFF',
            accountNumber: 'DE89370400440532013000',
            accountHolderName: 'John Doe',
            bankName: 'Deutsche Bank',
            bankAddress: 'Taunusanlage 12, 60325 Frankfurt',
            bankCountry: 'DE',
        }).unwrap();

        const recipient = Recipient.create({
            type: RECIPIENT_TYPE.COMPANY,
            name: 'Acme Corp',
            taxResidenceCountry: 'DE',
            address: '456 Berlin St',
            taxId: 'DE123456789',
            email: 'info@acme.com',
            billing,
        }).unwrap();

        const plain = recipient.toPlain();
        const restored = Recipient.fromPlain(plain);

        expect(restored.equals(recipient)).toBe(true);
    });
});
