/**
 * Interface for objects that can be compared for ordering.
 * @template T The type of object that can be compared with this object.
 */
export interface Comparable<T> {
    /**
     * Checks if this object is less than another object.
     * @param other The object to compare with.
     * @returns true if this object is less than the other object, false otherwise.
     */
    lessThan(other: T): boolean;
}

