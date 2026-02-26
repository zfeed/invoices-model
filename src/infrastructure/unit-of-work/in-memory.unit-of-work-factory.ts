import {
    UnitOfWork,
    UnitOfWorkFactory,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import '../mappers/authflow-policy.mapper';
import '../mappers/financial-document.mapper';
import { mappers } from '../registry';
import { InMemoryUnitOfWork } from './in-memory.unit-of-work';
import { Storage } from './storage/storage';

export class InMemoryUnitOfWorkFactory implements UnitOfWorkFactory {
    private readonly storage = new Storage();

    async start<T>(callback: (uow: UnitOfWork) => Promise<T>): Promise<T> {
        const uow = new InMemoryUnitOfWork(this.storage, mappers);

        await uow.start();
        const result = await callback(uow);
        await uow.finish();
        return result;
    }
}
