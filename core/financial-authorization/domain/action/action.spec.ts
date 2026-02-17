import { createAction } from './action';

describe('Action', () => {
    describe('createAction', () => {
        it('should create an action from a string', () => {
            const action = createAction('approve-invoice');
            expect(action).toBe('approve-invoice');
        });
    });
});
