import { Wire } from './wire';

const validData = {
    swift: 'DEUTDEFF',
    accountNumber: 'DE89370400440532013000',
    accountHolderName: 'John Doe',
    bankName: 'Deutsche Bank',
    bankAddress: 'Taunusanlage 12, 60325 Frankfurt',
    bankCountry: 'DE',
};

describe('Wire', () => {
    it('should create a wire billing', () => {
        const result = Wire.create(validData);
        const wire = result.unwrap();

        expect(wire.type).toBe('WIRE');
        expect(wire.data).toEqual(validData);
    });

    it('should serialize to plain and back', () => {
        const wire = Wire.create(validData).unwrap();
        const plain = wire.toPlain();
        const restored = Wire.fromPlain(plain);

        expect(restored.type).toBe('WIRE');
        expect(restored.data).toEqual(validData);
    });

    it('should fail with invalid SWIFT code', () => {
        const result = Wire.create({ ...validData, swift: 'INVALID' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13000' }),
        );
    });

    it('should fail with empty account number', () => {
        const result = Wire.create({ ...validData, accountNumber: '  ' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13002' }),
        );
    });

    it('should fail with empty account holder name', () => {
        const result = Wire.create({ ...validData, accountHolderName: '' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13002' }),
        );
    });

    it('should fail with empty bank name', () => {
        const result = Wire.create({ ...validData, bankName: '' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13002' }),
        );
    });

    it('should fail with empty bank address', () => {
        const result = Wire.create({ ...validData, bankAddress: '' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13002' }),
        );
    });

    it('should fail with invalid bank country', () => {
        const result = Wire.create({ ...validData, bankCountry: 'ZZZ' });

        expect(result.isError()).toBe(true);
        expect(result.unwrapError()).toEqual(
            expect.objectContaining({ code: '13001' }),
        );
    });
});
