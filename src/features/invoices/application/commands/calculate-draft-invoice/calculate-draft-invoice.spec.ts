import { CalculateDraftInvoice } from './calculate-draft-invoice.ts';
import { ISSUER_TYPE } from '../../../domain/issuer/issuer.ts';
import { RECIPIENT_TYPE } from '../../../domain/recipient/recipient.ts';

describe('CalculateDraftInvoice', () => {
    let command: CalculateDraftInvoice;

    beforeEach(() => {
        command = new CalculateDraftInvoice();
    });

    it('should return an empty draft for an empty request', () => {
        const result = command.execute({});

        expect(result).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                lineItems: null,
                totalAmount: null,
                totalCurrency: null,
                vatRate: null,
                vatAmount: null,
                vatCurrency: null,
                issueDate: null,
                dueDate: null,
                issuer: null,
                recipient: null,
            })
        );
    });

    it('should calculate total from line items', () => {
        const result = command.execute({
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
            ],
        });

        expect(result.totalAmount).toBe('200');
        expect(result.totalCurrency).toBe('USD');
        expect(result.lineItems!).toHaveLength(1);
    });

    it('should calculate total from multiple line items', () => {
        const result = command.execute({
            lineItems: [
                {
                    description: 'Consulting',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '2',
                },
                {
                    description: 'Development',
                    price: { amount: '150', currency: 'USD' },
                    quantity: '3',
                },
            ],
        });

        expect(result.totalAmount).toBe('650');
        expect(result.totalCurrency).toBe('USD');
        expect(result.lineItems!).toHaveLength(2);
    });

    it('should calculate total with vat', () => {
        const result = command.execute({
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '20',
        });

        expect(result.vatRate).toBe('0.2');
        expect(result.totalAmount).toBe('120');
        expect(result.totalCurrency).toBe('USD');
        expect(result.vatAmount).toBe('20');
        expect(result.vatCurrency).toBe('USD');
    });

    it('should include issue date in the result', () => {
        const result = command.execute({
            issueDate: '2025-01-01',
        });

        expect(result.issueDate).toBe('2025-01-01');
    });

    it('should include due date in the result', () => {
        const result = command.execute({
            dueDate: '2025-02-01',
        });

        expect(result.dueDate).toBe('2025-02-01');
    });

    it('should include issuer in the result', () => {
        const result = command.execute({
            issuer: {
                type: ISSUER_TYPE.COMPANY,
                name: 'Company Inc.',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
            },
        });

        expect(result.issuer).toEqual({
            type: 'COMPANY',
            name: 'Company Inc.',
            address: '123 Main St',
            taxId: 'TAX123',
            email: 'info@company.com',
        });
    });

    it('should include recipient with paypal billing in the result', () => {
        const result = command.execute({
            recipient: {
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'Jane Smith',
                address: '456 Oak Ave',
                taxId: 'TAX456',
                email: 'jane@example.com',
                taxResidenceCountry: 'US',
                billing: {
                    type: 'PAYPAL',
                    email: 'jane@paypal.com',
                },
            },
        });

        expect(result.recipient).toEqual(
            expect.objectContaining({
                type: 'INDIVIDUAL',
                name: 'Jane Smith',
                email: 'jane@example.com',
            })
        );
    });

    it('should calculate a fully populated draft', () => {
        const result = command.execute({
            lineItems: [
                {
                    description: 'Service',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '1',
                },
            ],
            vatRate: '10',
            issueDate: '2025-01-01',
            dueDate: '2025-02-01',
            issuer: {
                type: ISSUER_TYPE.COMPANY,
                name: 'Company Inc.',
                address: '123 Main St',
                taxId: 'TAX123',
                email: 'info@company.com',
            },
            recipient: {
                type: RECIPIENT_TYPE.INDIVIDUAL,
                name: 'Jane Smith',
                address: '456 Oak Ave',
                taxId: 'TAX456',
                email: 'jane@example.com',
                taxResidenceCountry: 'US',
                billing: {
                    type: 'PAYPAL',
                    email: 'jane@paypal.com',
                },
            },
        });

        expect(result.lineItems!).toHaveLength(1);
        expect(result.totalAmount).toBe('220');
        expect(result.totalCurrency).toBe('USD');
        expect(result.vatRate).toBe('0.1');
        expect(result.vatAmount).toBe('20');
        expect(result.vatCurrency).toBe('USD');
        expect(result.issueDate).toBe('2025-01-01');
        expect(result.dueDate).toBe('2025-02-01');
        expect(result.issuer).not.toBeNull();
        expect(result.recipient).not.toBeNull();
    });

    it('should not have side effects between calls', () => {
        const result1 = command.execute({
            lineItems: [
                {
                    description: 'First',
                    price: { amount: '100', currency: 'USD' },
                    quantity: '1',
                },
            ],
        });

        const result2 = command.execute({
            lineItems: [
                {
                    description: 'Second',
                    price: { amount: '200', currency: 'USD' },
                    quantity: '1',
                },
            ],
        });

        expect(result1.id).not.toBe(result2.id);
        expect(result1.totalAmount).toBe('100');
        expect(result2.totalAmount).toBe('200');
    });
});
