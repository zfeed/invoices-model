import { z } from 'zod';
import { KNOWN_ERROR_CODE } from '../../core/building-blocks/errors/known-error-codes.ts';
import { ERROR_CODE_DESCRIPTIONS } from '../../core/building-blocks/errors/error-code-descriptions.ts';

export const dataResponse = <T extends z.ZodType>(data: T) =>
    z.object({ data });

const errorBody = <T extends z.ZodRawShape>(shape: T) =>
    z.object({ error: z.object({ message: z.string(), ...shape }) });

const issueSchema = z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
});

// 400 — validation / invalid JSON: message + issues
export const validationErrorSchema = errorBody({
    issues: z.array(issueSchema),
});

// 500 — unhandled: message only
export const internalErrorSchema = errorBody({});

// a single code rendered as a described `const` so each value carries its meaning
const describedCode = (code: KNOWN_ERROR_CODE) =>
    z.literal(code).describe(ERROR_CODE_DESCRIPTIONS[code] ?? code);

// the `code` field: a union of described codes (or a single one)
const codeField = ([first, ...rest]: [
    KNOWN_ERROR_CODE,
    ...KNOWN_ERROR_CODE[],
]) =>
    rest.length === 0
        ? describedCode(first)
        : z.union([
              describedCode(first),
              describedCode(rest[0]),
              ...rest.slice(1).map(describedCode),
          ]);

// 422 — AppKnownError, restricted to the codes a route can emit
export const appErrorResponse = (
    ...codes: [KNOWN_ERROR_CODE, ...KNOWN_ERROR_CODE[]]
) => errorBody({ code: codeField(codes) });

// base errors present on every route (no 422)
export const errorResponses = {
    400: validationErrorSchema,
    500: internalErrorSchema,
};

// base + a route-specific 422
export const errorResponsesFor = (
    ...codes: [KNOWN_ERROR_CODE, ...KNOWN_ERROR_CODE[]]
) => ({
    ...errorResponses,
    422: appErrorResponse(...codes),
});
