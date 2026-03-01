import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { Approver } from '../approver/approver';
import { Id } from '../id/id';
import { Group } from './group';
import { checkTemplateApproversNotEmpty } from './checks/check-template-approvers-not-empty';
import { checkTemplateNoDuplicateApprovers } from './checks/check-template-no-duplicate-approvers';

export class GroupTemplate
    implements Mappable<ReturnType<GroupTemplate['toPlain']>>
{
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

    static fromPlain(plain: {
        id: string;
        requiredApprovals: number;
        approvers: { id: string; name: string; email: string }[];
    }) {
        return new GroupTemplate(
            Id.fromPlain(plain.id),
            plain.requiredApprovals,
            plain.approvers.map((a) => Approver.fromPlain(a))
        );
    }

    toGroup(): Result<DomainError, Group> {
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
