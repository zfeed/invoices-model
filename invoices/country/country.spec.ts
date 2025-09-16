import { Country } from './country';

describe("Country", () => {
    it("should create a country", () => {
        const result = Country.create({
            code: "US"
        });

        const country = result.unwrap();

        expect(country).toBeDefined();
    });

    it("should fail to create a country with not alpha 2 code", () => {
        const result = Country.create({
            code: "USA"
        });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(expect.objectContaining({
            code: '7000'
        }));
    });

    it("should compare two equal countries", () => {
        const result1 = Country.create({
            code: "US"
        }).unwrap();

        const result2 = Country.create({
            code: "US"
        }).unwrap();

        expect(result1.equals(result2)).toBe(true);
    });

    it("should compare two different countries", () => {
        const result1 = Country.create({
            code: "US"
        }).unwrap();

        const result2 = Country.create({
            code: "CA"
        }).unwrap();

        expect(result1.equals(result2)).toBe(false);
    });
});

