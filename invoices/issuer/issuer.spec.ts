import { Issuer } from './issuer';
import { Email } from '../email/email';

describe("Issuer", () => {
    it("should create an issuer", () => {
        const result = Issuer.create({
            name: "Company Inc.",
            address: "123 Main St, City, Country",
            taxId: "TAX123456",
            email: 'info@company.com',
        });

        const issuer = result.unwrap();

        expect(issuer.address).toBe("123 Main St, City, Country");
        expect(issuer.email.equals(Email.create("info@company.com").unwrap())).toBe(true);
        expect(issuer.name).toBe("Company Inc.");
        expect(issuer.taxId).toBe("TAX123456");
    });
});
