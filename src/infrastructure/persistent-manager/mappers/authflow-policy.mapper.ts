import { AuthflowPolicy } from '../../../core/financial-authorization/domain/authflow/authflow-policy';
import { Mapper } from './mapper';

type AuthflowPolicyPlain = ReturnType<AuthflowPolicy['toPlain']>;

class AuthflowPolicyMapper extends Mapper<AuthflowPolicy, AuthflowPolicyPlain> {
    entityClass() {
        return AuthflowPolicy;
    }

    toPlain(policy: AuthflowPolicy): AuthflowPolicyPlain {
        return policy.toPlain();
    }

    toDomain(plain: AuthflowPolicyPlain): AuthflowPolicy {
        return AuthflowPolicy.fromPlain(plain);
    }
}

new AuthflowPolicyMapper();
