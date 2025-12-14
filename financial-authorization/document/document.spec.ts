import { DOMAIN_ERROR_CODE } from '../../building-blocks/errors/domain/domain-codes';
import { Authflow } from '../authflow/authflow';
import { createDocument } from './document';

describe('createDocument', () => {
    it('should create a document successfully with unique authflow actions', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
            { id: '2', action: 'reject', isApproved: false, steps: [] },
            { id: '3', action: 'review', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-001',
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
        expect(document.referenceId).toBe('INV-001');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with empty authflows', () => {
        const authflows: Authflow[] = [];

        const result = createDocument({
            referenceId: 'INV-002',
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(0);
        expect(document.referenceId).toBe('INV-002');
        expect(document.id).toBeDefined();
    });

    it('should create a document successfully with a single authflow', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: true, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-003',
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(1);
        expect(document.authflows[0].action).toBe('approve');
    });

    it('should fail to create a document with duplicate authflow actions', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
            { id: '2', action: 'reject', isApproved: false, steps: [] },
            { id: '3', action: 'approve', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-004',
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should fail when all authflows have the same action', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
            { id: '2', action: 'approve', isApproved: false, steps: [] },
            { id: '3', action: 'approve', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-005',
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should fail when two authflows have the same action among unique ones', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
            { id: '2', action: 'reject', isApproved: false, steps: [] },
            { id: '3', action: 'review', isApproved: false, steps: [] },
            { id: '4', action: 'reject', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-006',
            authflows,
        });

        expect(result.isError()).toBe(true);
        const error = result.unwrapError();
        expect(error.message).toBe('Duplicate authflow actions found');
        expect(error.code).toBe(
            DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_ACTION_DUPLICATE
        );
    });

    it('should treat action names as case-sensitive', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
            { id: '2', action: 'Approve', isApproved: false, steps: [] },
            { id: '3', action: 'APPROVE', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-007',
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toHaveLength(3);
    });

    it('should generate a unique id for the document', () => {
        const authflows: Authflow[] = [
            { id: '1', action: 'approve', isApproved: false, steps: [] },
        ];

        const result1 = createDocument({
            referenceId: 'INV-008',
            authflows,
        });

        const result2 = createDocument({
            referenceId: 'INV-008',
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const document1 = result1.unwrap();
        const document2 = result2.unwrap();

        expect(document1.id).toBeDefined();
        expect(document2.id).toBeDefined();
        expect(document1.id).not.toBe(document2.id);
    });

    it('should preserve authflow data in the created document', () => {
        const authflows: Authflow[] = [
            { id: 'flow-1', action: 'approve', isApproved: true, steps: [] },
            { id: 'flow-2', action: 'reject', isApproved: false, steps: [] },
        ];

        const result = createDocument({
            referenceId: 'INV-009',
            authflows,
        });

        expect(result.isOk()).toBe(true);
        const document = result.unwrap();
        expect(document.authflows).toEqual(authflows);
    });

    it('should create a document with different referenceId formats', () => {
        const authflows: Authflow[] = [];

        const result1 = createDocument({
            referenceId: '',
            authflows,
        });

        const result2 = createDocument({
            referenceId: 'invoice-2024-001-special-chars_test',
            authflows,
        });

        const result3 = createDocument({
            referenceId: '12345',
            authflows,
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);
        expect(result3.isOk()).toBe(true);

        expect(result1.unwrap().referenceId).toBe('');
        expect(result2.unwrap().referenceId).toBe(
            'invoice-2024-001-special-chars_test'
        );
        expect(result3.unwrap().referenceId).toBe('12345');
    });
});
