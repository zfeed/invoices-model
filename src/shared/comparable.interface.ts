export interface Comparable<T> {
    lessThan(other: T): boolean;
    lessThanEqual(other: T): boolean;
    greaterThan(other: T): boolean;
    greaterThanEqual(other: T): boolean;
}
