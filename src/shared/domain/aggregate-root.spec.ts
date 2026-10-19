import { AggregateRoot } from './aggregate-root.js';
import type { DomainEvent } from './domain-event.js';

class OrderPlaced implements DomainEvent {
  readonly eventName = 'OrderPlaced';
  readonly occurredAt = new Date();
}

class Order extends AggregateRoot {
  constructor(id: string) {
    super(id);
  }

  place(): void {
    this.addDomainEvent(new OrderPlaced());
  }
}

describe('AggregateRoot', () => {
  it('um novo agregado começa sem eventos', () => {
    const order = new Order('1');
    expect(order.pullDomainEvents()).toEqual([]);
  });

  it('adicionar dois eventos deve acumular dois eventos', () => {
    const order = new Order('1');
    order.place();
    order.place();
    expect(order.pullDomainEvents()).toHaveLength(2);
  });

  it('depois de puxar os eventos do agregado, uma segunda chamada devolve uma lista vazia', () => {
    const order = new Order('1');
    order.place();
    order.pullDomainEvents();
    expect(order.pullDomainEvents()).toEqual([]);
  });
});
