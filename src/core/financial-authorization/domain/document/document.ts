import {
    KNOWN_ERROR_CODE,
    AppKnownError,
    Mappable,
    Result,
} from '../../../../shared/index.ts';
import { DomainEvent } from '../../../bulding-blocks/events/domain-event.ts';
import { PublishableEvents } from '../../../bulding-blocks/events/event-publisher.interface.ts';
import { Action } from '../action/action.ts';
import { Approval } from '../approval/approval.ts';
import { Authflow } from '../authflow/authflow.ts';
import { Id } from '../id/id.ts';
import { Money } from '../money/money.ts';
import { ReferenceId } from '../reference-id/reference-id.ts';
import { checkNoDuplicateAuthflowActions } from './checks/check-no-duplicate-authflow-actions.ts';
import { DocumentApprovedEvent } from './events/document-approved.event.ts';
import { DocumentCreatedEvent } from './events/document-created.event.ts';

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

        doc._events.push(DocumentCreatedEvent.create(doc.toPlain()));

        return Result.ok(doc);
    }

    apply(
        action: Action,
        approval: Approval
    ): Result<AppKnownError, undefined> {
        const authflow = this._authflows.find((a) => a.action.equals(action));

        if (!authflow) {
            return Result.error(
                new AppKnownError({
                    code: KNOWN_ERROR_CODE.FINANCIAL_AUTHORIZATION_AUTHFLOW_NOT_FOUND,
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

        this._events.push(DocumentApprovedEvent.create(this.toPlain()));

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
