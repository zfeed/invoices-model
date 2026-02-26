import {
    UnitOfWork as UnitOfWorkInterface,
    Session as SessionInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import '../mappers/authflow-policy.mapper';
import '../mappers/financial-document.mapper';
import { UnitOfWork } from './unit-of-work';
import { Storage } from './storage/storage';

export class Session implements SessionInterface {
    private readonly storage: Storage;
    private readonly maxRetries: number;

    constructor(options: { storage: Storage; maxRetries: number }) {
        this.storage = options.storage;
        this.maxRetries = options.maxRetries;
    }

    async begin(): Promise<UnitOfWorkInterface> {
        const uow = new UnitOfWork(this.storage, {
            maxRetries: this.maxRetries,
        });

        return uow;
    }
}
