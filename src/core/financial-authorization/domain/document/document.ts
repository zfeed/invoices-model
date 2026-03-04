import {
    DOMAIN_ERROR_CODE,
    DomainError,
    Mappable,
    Result,
} from '../../../../building-blocks';
import { DomainEvent } from '../../../../building-blocks/events/domain-event';
import { PublishableEvents } from '../../../../building-blocks/events/event-publisher.interface';
import { Action } from '../action/action';
import { Approval } from '../approval/approval';
import { Authflow } from '../authflow/authflow';
import { Id } from '../id/id';
import { Money } from '../money/money';
import { ReferenceId } from '../reference-id/reference-id';
import { checkNoDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions';
import { DocumentApprovedEvent } from './events/document-approved.event';
import { DocumentCreatedEvent } from './events/document-created.event';

export class FinancialDocument
    implements
        Mappable<ReturnType<FinancialDocument['toPlain']>>,
        PublishableEvents<DomainEvent<any>>
{
    protected _id: Id;
    protected _referenceId: ReferenceId;
    protected _value: Money;
    protected _authflows: Authflow[];
    protected _events: DomainEvent<any>[] = [];

    protected constructor(
        id: Id,
        referenceId: ReferenceId,
        value: Money,
        authflows: Authflow[]
    ) {
        this._id = id;
        this._referenceId = referenceId;
        this._value = value;
        this._authflows = authflows;
    }

    public get id(): Id {
        return this._id;
    }

    public get referenceId(): ReferenceId {
        return this._referenceId;
    }

    public get value(): Money {
        return this._value;
    }

    public get authflows(): Authflow[] {
        return this._authflows;
    }

    public get events(): DomainEvent<any>[] {
        return this._events;
    }

    static create(data: {
        referenceId: ReferenceId;
        value: Money;
        authflows: Authflow[];
    }) {
        const error = checkNoDuplicateAuthflowActions(data.authflows);
        if (error) {
            return Result.error(error);
        }

        const doc = new FinancialDocument(
            Id.create().unwrap(),
            data.referenceId,
            data.value,
            data.authflows
        );

        doc._events.push(new DocumentCreatedEvent(doc.toPlain()));

        return Result.ok(doc);
    }

    apply(action: Action, approval: Approval): Result<DomainError, undefined> {
        const authflow = this._authflows.find((a) => a.action.equals(action));

        if (!authflow) {
            return Result.error(
                new DomainError({
                    code: DOMAIN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
                    message: `Authflow with action ${action.toPlain()} not found`,
                })
            );
        }

        const authflowResult = authflow.apply(approval);

        if (authflowResult.isError()) {
            return Result.error(authflowResult.unwrapError());
        }

        this._authflows = this._authflows.map((a) =>
            a.action.equals(action) ? authflowResult.unwrap() : a
        );

        const dupError = checkNoDuplicateAuthflowActions(this._authflows);
        if (dupError) {
            return Result.error(dupError);
        }

        this._events.push(new DocumentApprovedEvent(this.toPlain()));

        return Result.ok(undefined);
    }

    isActionApproved(action: Action): boolean {
        const authflow = this._authflows.find((a) => a.action.equals(action));
        return authflow ? authflow.isApproved : false;
    }

    canApproverApprove(action: Action, approverId: Id): boolean {
        const authflow = this._authflows.find((a) => a.action.equals(action));

        if (!authflow) {
            return false;
        }

        return authflow.canApproverApprove(approverId);
    }

    toPlain() {
        return {
            id: this._id.toPlain(),
            referenceId: this._referenceId.toPlain(),
            value: this._value.toPlain(),
            authflows: this._authflows.map((a) => a.toPlain()),
        };
    }
}
