import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { IO } from '../../../../building-blocks/io';
import { Result } from '../../../../building-blocks/result';
import { Some } from '../../../../building-blocks/some';
import { Action } from '../../domain/action/action';
import { AuthflowPolicy } from '../../domain/authflow/authflow-policy';

export interface PolicyStorage {
    findByAction(action: Action): IO<Some<AuthflowPolicy>>;
    save(
        policy: AuthflowPolicy
    ): IO<Result<DomainError, AuthflowPolicy>>;
}
