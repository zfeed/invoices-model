import {
    UnitOfWork as UnitOfWorkInterface,
    UnitOfWorkFactory as UnitOfWorkFactoryInterface,
} from '../../core/shared/unit-of-work/unit-of-work.interface';
import '../mappers/draft-invoice.mapper';
import '../mappers/invoice.mapper';
import '../mappers/authflow-policy.mapper';
import '../mappers/financial-document.mapper';
import { UnitOfWork } from './unit-of-work';
import { Storage } from './storage/storage';

export class UnitOfWorkFactory implements UnitOfWorkFactoryInterface {
    private readonly storage = new Storage();

    async start<T>(
        callback: (uow: UnitOfWorkInterface) => Promise<T>
    ): Promise<T> {
        const uow = new UnitOfWork(this.storage);

        await uow.start();
        const result = await callback(uow);
        await uow.finish();
        return result;
    }
}
