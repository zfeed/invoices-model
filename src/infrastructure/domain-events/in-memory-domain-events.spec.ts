import { testDomainEvents } from '../../shared/domain-events/domain-events.test-helper';
import { InMemoryDomainEvents } from './in-memory-domain-events';

testDomainEvents({
    typeName: 'InMemoryDomainEvents',
    createDomainEvents: () => new InMemoryDomainEvents(),
});
