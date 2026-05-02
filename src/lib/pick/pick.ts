type StripPrefix<T, P extends string> = {
    [K in keyof T as K extends `${P}${infer R}` ? R : never]: T[K];
};

export function pick<T extends Record<string, unknown>, P extends string>(
    rows: T[],
    prefix: P
): StripPrefix<T, P>[] {
    return rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const key in row) {
            if (key.startsWith(prefix)) {
                out[key.slice(prefix.length)] = row[key];
            }
        }
        return out as StripPrefix<T, P>;
    });
}
