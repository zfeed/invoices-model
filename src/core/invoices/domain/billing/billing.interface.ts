export interface IBilling<T, D> {
    type: T;
    data: D;
    toPlain(): { type: T; data: unknown };
}
