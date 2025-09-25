import { Issuer, ISSUER_TYPE } from './issuer';
import { Email } from '../email/email';

describe('Issuer', () => {
    it('should create an individual issuer', () => {
        const result = Issuer.create({
            type: ISSUER_TYPE.INDIVIDUAL,
            name: 'John Doe',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        });

        const issuer = result.unwrap();

        expect(issuer.address).toBe('123 Main St, City, Country');
        expect(
            issuer.email.equals(Email.create('info@company.com').unwrap())
        ).toBe(true);
        expect(issuer.name).toBe('John Doe');
        expect(issuer.taxId).toBe('TAX123456');
        expect(issuer.type).toBe('INDIVIDUAL');
    });

    it('should create a company issuer', () => {
        const result = Issuer.create({
            type: ISSUER_TYPE.COMPANY,
            name: 'Company Inc.',
            address: '123 Main St, City, Country',
            taxId: 'TAX123456',
            email: 'info@company.com',
        });

        const issuer = result.unwrap();

        expect(issuer.address).toBe('123 Main St, City, Country');
        expect(
            issuer.email.equals(Email.create('info@company.com').unwrap())
        ).toBe(true);
        expect(issuer.name).toBe('Company Inc.');
        expect(issuer.taxId).toBe('TAX123456');
        expect(issuer.type).toBe('COMPANY');
    });
});
