import { testDomainEventsBus } from '../../shared/domain-events/domain-events-bus.test-helper.ts';
import { InMemoryDomainEventsBus } from './in-memory-domain-events-bus.ts';

testDomainEventsBus({
    typeName: 'InMemoryDomainEventsBus',
    createDomainEventsBus: () => new InMemoryDomainEventsBus(),
});
