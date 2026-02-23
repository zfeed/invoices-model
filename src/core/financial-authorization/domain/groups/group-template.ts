import { DomainError, Mappable, Result } from '../../../../building-blocks';
import { Approver } from '../approver/approver';
import { Id } from '../id/id';
import { Group } from './group';
import { checkTemplateApproversNotEmpty } from './checks/check-template-approvers-not-empty';
import { checkTemplateNoDuplicateApprovers } from './checks/check-template-no-duplicate-approvers';

export class GroupTemplate implements Mappable<ReturnType<GroupTemplate['toPlain']>> {
    #id: Id;
    #approvers: Approver[];

    protected constructor(id: Id, approvers: Approver[]) {
        this.#id = id;
        this.#approvers = approvers;
    }

    public get id(): Id {
        return this.#id;
    }

    public get approvers(): readonly Approver[] {
        return this.#approvers;
    }

    static create(data: { approvers: Approver[] }) {
        const emptyError = checkTemplateApproversNotEmpty(data.approvers);
        if (emptyError) {
            return Result.error(emptyError);
        }

        const duplicateError = checkTemplateNoDuplicateApprovers(data.approvers);
        if (duplicateError) {
            return Result.error(duplicateError);
        }

        return Result.ok(new GroupTemplate(Id.create().unwrap(), data.approvers));
    }

    static fromPlain(plain: {
        id: string;
        approvers: { id: string; name: string; email: string }[];
    }) {
        return new GroupTemplate(
            Id.fromPlain(plain.id),
            plain.approvers.map((a) => Approver.fromPlain(a)),
        );
    }

    toGroup(): Result<DomainError, Group> {
        return Group.create({
            approvers: this.#approvers,
            approvals: [],
        });
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            approvers: this.#approvers.map((a) => a.toPlain()),
        };
    }
}
