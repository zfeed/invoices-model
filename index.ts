import { Numeric } from './src/features/invoices/domain/numeric/numeric';
import { NumericDataMapper } from './src/features/invoices/infrastructure/mappers/numeric.data-mapper';

// Client creates a domain Numeric — knows nothing about persistence
const numeric = Numeric.create('123.45').unwrap();

// Infrastructure layer converts to a DB record
const mapped = NumericDataMapper.from(numeric);
const record = mapped.toRecord();
// { value: '123.45' }
console.log(record);

const record2 = NumericDataMapper.from(
    NumericDataMapper.from(mapped)
).toRecord();

console.log(record2, 'record2');

// And back from a DB record to a domain object
const hydrated = NumericDataMapper.fromRecord(record);

console.log(hydrated.add(Numeric.create('100').unwrap()).toString());
