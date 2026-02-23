import { Email } from '../email/email';
import { Name } from '../name/name';
import { Approver } from './approver';

describe('Approver.create', () => {
    it('should create an approver with valid data', () => {
        const name = Name.fromPlain('John Doe');
        const email = Email.fromPlain('john.doe@example.com');

        const result = Approver.create({ name, email });

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        expect(approver.name.toPlain()).toBe('John Doe');
        expect(approver.email.toPlain()).toBe('john.doe@example.com');
        expect(approver.id).toBeDefined();
        expect(typeof approver.id.toPlain()).toBe('string');
        expect(approver.id.toPlain().length).toBeGreaterThan(0);
    });

    it('should generate a unique ID for each approver', () => {
        const name = Name.fromPlain('Jane Smith');
        const email = Email.fromPlain('jane.smith@example.com');

        const result1 = Approver.create({ name, email });
        const result2 = Approver.create({ name, email });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        const approver1 = result1.unwrap();
        const approver2 = result2.unwrap();

        expect(approver1.id.toPlain()).not.toBe(approver2.id.toPlain());
    });

    it('should generate valid UUID format for id', () => {
        const name = Name.fromPlain('UUID Test');
        const email = Email.fromPlain('uuid@example.com');

        const result = Approver.create({ name, email });

        expect(result.isOk()).toBe(true);
        const approver = result.unwrap();
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(approver.id.toPlain()).toMatch(uuidRegex);
    });
});
