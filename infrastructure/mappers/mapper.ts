import { register, EntityClass } from '../registry';

export abstract class Mapper<TDomain = any, TPlain = any> {
    abstract entityClass(): EntityClass;
    abstract toDomain(plain: TPlain): TDomain;
    abstract toPlain(entity: TDomain): TPlain;

    constructor() {
        register(this.entityClass(), this);
    }
}
