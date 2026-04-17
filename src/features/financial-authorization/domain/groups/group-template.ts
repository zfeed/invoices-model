import { AppKnownError, Mappable, Result } from '../../../../shared/index.ts';
import { Approver } from '../approver/approver.ts';
import { Id } from '../id/id.ts';
import { Group } from './group.ts';
import { checkTemplateApproversNotEmpty } from './checks/check-template-approvers-not-empty.ts';
import { checkTemplateNoDuplicateApprovers } from './checks/check-template-no-duplicate-approvers.ts';

export class GroupTemplate implements Mappable<
    ReturnType<GroupTemplate['toPlain']>
> {
    protected _id: Id;
    protected _requiredApprovals: number;
    protected _approvers: Approver[];

    protected constructor(
        id: Id,
        requiredApprovals: number,
        approvers: Approver[]
    ) {
        this._id = id;
        this._requiredApprovals = requiredApprovals;
        this._approvers = approvers;
    }

    public get id(): Id {
        return this._id;
    }

    public get requiredApprovals(): number {
        return this._requiredApprovals;
    }

    public get approvers(): Approver[] {
        return this._approvers;
    }

    static create(data: { requiredApprovals: number; approvers: Approver[] }) {
        const emptyError = checkTemplateApproversNotEmpty(data.approvers);
        if (emptyError) {
            return Result.error(emptyError);
        }

        const duplicateError = checkTemplateNoDuplicateApprovers(
            data.approvers
        );
        if (duplicateError) {
            return Result.error(duplicateError);
        }

        return Result.ok(
            new GroupTemplate(
                Id.create().unwrap(),
                data.requiredApprovals,
                data.approvers
            )
        );
    }

    toGroup(): Result<AppKnownError, Group> {
        return Group.create({
            requiredApprovals: this._requiredApprovals,
            approvers: this._approvers,
            approvals: [],
        });
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            requiredApprovals: this._requiredApprovals,
            approvers: this._approvers.map((a) => a.toPlain()),
        };
    }
}
