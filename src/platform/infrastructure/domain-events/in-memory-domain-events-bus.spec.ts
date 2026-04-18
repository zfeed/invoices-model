import { testDomainEventsBus } from '../../../core/building-blocks/interfaces/domain-events-bus/domain-events-bus.test-helper.ts';
import { InMemoryDomainEventsBus } from './in-memory-domain-events-bus.ts';

testDomainEventsBus({
    typeName: 'InMemoryDomainEventsBus',
    createDomainEventsBus: () => new InMemoryDomainEventsBus(),
});
