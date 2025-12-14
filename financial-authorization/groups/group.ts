import { randomUUID } from 'crypto';
import { always, applySpec, isNotEmpty, pipe, prop } from 'ramda';
import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { Result } from '../../building-blocks/result';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { approvalReferencesExistingApprover } from './checks/check-approver-exists';
import { approversNotEmpty } from './checks/check-approvers-not-empty';
import { noDuplicateApprovals } from './checks/check-no-duplicate-approvals';
import { checkNoDuplicateApprovers } from './checks/check-no-duplicate-approvers';
approvalReferencesExistingApprover;
export type Group = {
    id: string;
    isApproved: boolean;
    approvers: Approver[];
    approvals: Approval[];
};

type GroupInput = {
    approvers: Approver[];
    approvals: Approval[];
};

// Lift check function into Result monad: error → Left, null → Right (pass-through)
const liftCheck =
    <T>(check: (data: T) => DomainError | null) =>
    (data: T): Result<DomainError, T> => {
        const error = check(data);
        return error ? Result.error(error) : Result.ok(data);
    };

// Validators lifted into Result

const approversNotDuplicated = liftCheck<GroupInput>(({ approvers }) =>
    checkNoDuplicateApprovers(approvers)
);

// Build Group using applySpec for declarative object construction
const buildGroup = applySpec<Group>({
    id: always(randomUUID()),
    isApproved: pipe(prop('approvals'), isNotEmpty),
    approvers: prop('approvers'),
    approvals: prop('approvals'),
});

// Factory: monadic validation chain → map to Group
export const createGroup = (data: GroupInput): Result<DomainError, Group> =>
    Result.ok<DomainError, GroupInput>(data)
        .flatMap(approversNotEmpty)
        .flatMap(approversNotDuplicated)
        .flatMap(approvalReferencesExistingApprover)
        .flatMap(noDuplicateApprovals)
        .map(buildGroup);
