import { testEquatable } from '../../building-blocks/equatable.test-helper';
import { CalendarDate } from './calendar-date';

describe('CalendarDate', () => {
    testEquatable({
        typeName: 'CalendarDate',
        createEqual: () => [
            CalendarDate.create('2023-01-01').unwrap(),
            CalendarDate.create('2023-01-01').unwrap(),
            CalendarDate.create('2023-01-01').unwrap(),
        ],
        createDifferent: () => [
            CalendarDate.create('2023-01-01').unwrap(),
            CalendarDate.create('2023-01-02').unwrap(),
        ],
    });

    it('should create issue date', () => {
        const issueDate = CalendarDate.create('2023-01-01').unwrap();

        expect(issueDate).toBeDefined();
    });

    it("should not create issue date if it's not a valid date", () => {
        const result = CalendarDate.create('invalid-date');

        expect(result.unwrapError()).toEqual(
            expect.objectContaining({
                code: '3000',
            })
        );
    });

    it('should compare date with another date', () => {
        const date1 = CalendarDate.create('2023-01-01').unwrap();
        const date2 = CalendarDate.create('2023-01-02').unwrap();

        expect(date1.lessThan(date2)).toBe(true);
    });

    it('should compare date with another date', () => {
        const date1 = CalendarDate.create('2023-01-01').unwrap();
        const date2 = CalendarDate.create('2023-01-02').unwrap();

        expect(date2.lessThan(date1)).toBe(false);
    });
});
