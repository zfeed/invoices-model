import { DOMAIN_ERROR_CODE } from '../../../../building-blocks/errors/domain/domain-codes';
import { Action } from './action';

describe('Action', () => {
    describe('create', () => {
        it('should create an action from a valid string', () => {
            const result = Action.create('approve-invoice');

            expect(result.isOk()).toBe(true);
            expect(result.unwrap().toPlain()).toBe('approve-invoice');
        });

        it('should reject empty action', () => {
            const result = Action.create('');

            expect(result.isError()).toBe(true);
            const error = result.unwrapError();
            expect(error.message).toBe('Action cannot be blank');
            expect(error.code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK
            );
        });

        it('should reject whitespace-only action', () => {
            const result = Action.create('   ');

            expect(result.isError()).toBe(true);
            const error = result.unwrapError();
            expect(error.message).toBe('Action cannot be blank');
            expect(error.code).toBe(
                DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_ACTION_BLANK
            );
        });
    });
});
