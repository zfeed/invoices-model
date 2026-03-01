import _ from 'lodash';

type Relation =
    | { prefix: string; type: 'many'; id: string }
    | { prefix: string; type: 'one' };

type StripPrefix<T, P extends string> = {
    [K in keyof T as K extends `${P}${infer Rest}` ? Rest : never]: T[K];
};

type AllPrefixes<R extends Record<string, { prefix: string }>> =
    R[keyof R]['prefix'];

type HydrateResult<T, R extends Record<string, Relation>> = {
    [K in keyof T as K extends `${AllPrefixes<R>}${string}` ? never : K]: T[K];
} & {
    [Name in keyof R]: R[Name] extends {
        type: 'many';
        prefix: infer P extends string;
    }
        ? StripPrefix<T, P>[]
        : R[Name] extends { type: 'one'; prefix: infer P extends string }
          ? StripPrefix<T, P> | null
          : never;
};

export function unflatten<
    T extends Record<string, unknown>,
    const R extends Record<string, Relation>,
>(rows: T[], relations: R): HydrateResult<T, R> | null {
    if (rows.length === 0) return null;

    const prefixes = _.map(relations, 'prefix');

    const stripPrefix = (prefix: string, row: T) =>
        _.mapKeys(
            _.pickBy(row, (_v, key) => key.startsWith(prefix)),
            (_v, key) => key.slice(prefix.length)
        );

    const root = _.pickBy(
        rows[0],
        (_v, key) => !prefixes.some((p) => key.startsWith(p))
    );

    const nested = _.mapValues(relations, (rel) => {
        if (rel.type === 'one') {
            const extracted = stripPrefix(rel.prefix, rows[0]);
            return extracted['id'] != null ? extracted : null;
        }

        return _.uniqBy(rows, `${rel.prefix}${rel.id}`)
            .filter((row) => row[`${rel.prefix}${rel.id}`] != null)
            .map((row) => stripPrefix(rel.prefix, row));
    });

    return { ...root, ...nested } as HydrateResult<T, R>;
}
