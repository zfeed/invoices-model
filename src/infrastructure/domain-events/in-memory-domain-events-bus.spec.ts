import { testDomainEventsBus } from '../../shared/domain-events/domain-events-bus.test-helper';
import { InMemoryDomainEventsBus } from './in-memory-domain-events-bus';

testDomainEventsBus({
    typeName: 'InMemoryDomainEventsBus',
    createDomainEventsBus: () => new InMemoryDomainEventsBus(),
});
