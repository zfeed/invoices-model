import { DOMAIN_ERROR_CODE, DomainError, Mappable, Result } from '../../../../building-blocks';
import { DomainEvent } from '../../../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../../../building-blocks/events/event-publisher.interface';
import { Action } from '../action/action';
import { Approval } from '../approval/approval';
import { Approver } from '../approver/approver';
import { Authflow } from '../authflow/authflow';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { ReferenceId } from '../reference-id/reference-id';
import { checkNoDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';
import { DocumentApprovedEvent } from './events/document-approved.event';
import { DocumentCreatedEvent } from './events/document-created.event';

export class FinancialDocument implements Mappable<ReturnType<FinancialDocument['toPlain']>>, PublishableEvents<DomainEvent<any>> {
    #id: Id;
    #referenceId: ReferenceId;
    #value: Money;
    #authflows: Authflow[];
    #events: DomainEvent<any>[] = [];

    protected constructor(
        id: Id,
        referenceId: ReferenceId,
        value: Money,
        authflows: Authflow[],
    ) {
        this.#id = id;
        this.#referenceId = referenceId;
        this.#value = value;
        this.#authflows = authflows;
    }

    public get id(): Id {
        return this.#id;
    }

    public get referenceId(): ReferenceId {
        return this.#referenceId;
    }

    public get value(): Money {
        return this.#value;
    }

    public get authflows(): readonly Authflow[] {
        return this.#authflows;
    }

    public get events(): ReadonlyArray<DomainEvent<any>> {
        return this.#events;
    }

    static create(data: { referenceId: ReferenceId; value: Money; authflows: Authflow[] }) {
        const error = checkNoDuplicateAuthflowActions(data.authflows);
        if (error) {
            return Result.error(error);
        }

        const doc = new FinancialDocument(
            Id.create().unwrap(),
            data.referenceId,
            data.value,
            data.authflows,
        );

        doc.#events.push(new DocumentCreatedEvent(doc.toPlain()));

        return Result.ok(doc);
    }

    static fromPlain(plain: {
        id: string;
        referenceId: string;
        value: { amount: string; currency: string };
        authflows: {
            id: string;
            action: string;
            range: { from: { amount: string; currency: string }; to: { amount: string; currency: string } };
            steps: {
                id: string;
                order: number;
                groups: {
                    id: string;
                    requiredApprovals: number;
                    approvers: { id: string; name: string; email: string }[];
                    approvals: { approverId: string; createdAt: string; comment: string | null }[];
                }[];
            }[];
        }[];
    }) {
        return new FinancialDocument(
            Id.fromPlain(plain.id),
            ReferenceId.fromPlain(plain.referenceId),
            Money.fromPlain(plain.value),
            plain.authflows.map((a) => Authflow.fromPlain(a)),
        );
    }

    approve(action: Action, approver: Approver): Result<DomainError, undefined> {
        const authflow = this.#authflows.find((a) => a.action.equals(action));

        if (!authflow) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
                    message: `Authflow with action ${action.toPlain()} not found`,
                })
            );
        }

        const approvalResult = Approval.create({ approverId: approver.id, comment: null });

        if (approvalResult.isError()) {
            return Result.error(approvalResult.unwrapError());
        }

        const authflowResult = authflow.apply(approvalResult.unwrap());

        if (authflowResult.isError()) {
            return Result.error(authflowResult.unwrapError());
        }

        this.#authflows = this.#authflows.map((a) =>
            a.action.equals(action) ? authflowResult.unwrap() : a
        );

        const dupError = checkNoDuplicateAuthflowActions(this.#authflows);
        if (dupError) {
            return Result.error(dupError);
        }

        this.#events.push(new DocumentApprovedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    isActionApproved(action: Action): boolean {
        const authflow = this.#authflows.find((a) => a.action.equals(action));
        return authflow ? authflow.isApproved : false;
    }

    canApproverApprove(action: Action, approverId: Id): boolean {
        const authflow = this.#authflows.find((a) => a.action.equals(action));

        if (!authflow) {
            return false;
        }

        return authflow.canApproverApprove(approverId);
    }

    toPlain() {
        return {
            id: this.#id.toPlain(),
            referenceId: this.#referenceId.toPlain(),
            value: this.#value.toPlain(),
            authflows: this.#authflows.map((a) => a.toPlain()),
        };
    }
}
