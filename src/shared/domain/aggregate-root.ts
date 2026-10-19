import type { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<TId = string> extends Entity<TId> {
  #domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.#domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this.#domainEvents;
    this.#domainEvents = [];
    return events;
  }
}
