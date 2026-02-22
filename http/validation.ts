import { z } from 'zod';

export class ValidationError extends Error {
    issues: { path: PropertyKey[]; message: string }[];

    constructor(error: z.core.$ZodError) {
        super('Validation failed');
        this.issues = error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
        }));
    }
}

export const parse = <T extends z.ZodType>(
    schema: T,
    data: unknown
): z.infer<T> => {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new ValidationError(result.error);
    }

    return result.data;
};
