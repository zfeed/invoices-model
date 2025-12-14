import { Result } from '../../building-blocks/result';

export type Approval = {
    approverId: string;
    createdAt: Date;
    comment: string | null;
};

export function createApproval(data: {
    approverId: string;
    comment: string | null;
}): Result<never, Approval> {
    return Result.ok({
        approverId: data.approverId,
        createdAt: new Date(),
        comment: data.comment,
    });
}
