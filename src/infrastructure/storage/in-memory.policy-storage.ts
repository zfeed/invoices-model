import { DomainError } from '../../building-blocks/errors/domain/domain.error';
import { IO } from '../../building-blocks/io';
import { Result } from '../../building-blocks/result';
import { Some } from '../../building-blocks/some';
import { PolicyStorage } from '../../core/financial-authorization/application/storage/policy-storage.interface';
import { Action } from '../../core/financial-authorization/domain/action/action';
import { AuthflowPolicy } from '../../core/financial-authorization/domain/authflow/authflow-policy';
import { Store } from '../store/store';

export class InMemoryPolicyStorage implements PolicyStorage {
    private readonly store = new Store<AuthflowPolicy>();

    findByAction(action: Action): IO<Some<AuthflowPolicy>> {
        return IO.from(async () => {
            const record = this.store.get(action);

            if (!record) {
                return Some.none();
            }

            return Some.of({ ...record.value, version: record.version });
        });
    }

    save(
        policy: AuthflowPolicy
    ): IO<Result<DomainError, AuthflowPolicy>> {
        return IO.from(async () => {
            const expectedVersion =
                policy.version === 0 ? null : policy.version;

            const newVersion = this.store.setIfVersion(
                policy.action,
                policy,
                expectedVersion
            );

            return Result.ok({ ...policy, version: newVersion });
        });
    }
}
