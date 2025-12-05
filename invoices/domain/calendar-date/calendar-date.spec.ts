import { testComparable } from '../../../building-blocks/comparable.test-helper';
import { testEquatable } from '../../../building-blocks/equatable.test-helper';
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

    testComparable({
        typeName: 'CalendarDate',
        createAscending: () => [
            CalendarDate.create('2023-01-01').unwrap(),
            CalendarDate.create('2023-06-15').unwrap(),
            CalendarDate.create('2023-12-31').unwrap(),
        ],
        createEqual: () => [
            CalendarDate.create('2023-05-10').unwrap(),
            CalendarDate.create('2023-05-10').unwrap(),
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
});
