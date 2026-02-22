/**
 * Interface for objects that can be compared for equality.
 * @template T The type of object that can be compared with this object.
 */
export interface Equatable<T> {
    /**
     * Checks if this object is equal to another object.
     * @param other The object to compare with.
     * @returns true if the objects are equal, false otherwise.
     */
    equals(other: T): boolean;
}

