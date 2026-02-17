import { createName } from './name';

describe('Name', () => {
    describe('createName', () => {
        it('should create a name from a string', () => {
            const name = createName('John Doe');
            expect(name).toBe('John Doe');
        });
    });
});
