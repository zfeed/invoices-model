import { IssueDate } from "./calendar-date";

describe("CalendarDate", () => {
    it("should create issue date", () => {
        const issueDate = IssueDate.create("2023-01-01").unwrap();

        expect(issueDate).toBeDefined();
    });

    it("should not create issue date if it's not a valid date", () => {
        const result = IssueDate.create("invalid-date");

        expect(result.value).toEqual(expect.objectContaining({
            code: 5,
        }));
    });

    it("should compare equal dates", () => {
        const date1 = IssueDate.create("2023-01-01").unwrap();
        const date2 = IssueDate.create("2023-01-01").unwrap();

        expect(date1.equals(date2)).toBe(true);
    });

    it("should compare different dates", () => {
        const date1 = IssueDate.create("2023-01-01").unwrap();
        const date2 = IssueDate.create("2023-01-02").unwrap();

        expect(date1.equals(date2)).toBe(false);
    });
});
