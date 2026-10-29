import type { DomainEvent } from '../../../shared/domain/domain-event.js';
import type { Money } from '../../../shared/domain/money.js';
import type { Quantity } from '../../../shared/domain/quantity.js';

export interface PartToReverse {
  partId: string;
  quantity: Quantity;
}

export class ServiceOrderOpened implements DomainEvent {
  readonly eventName = 'ServiceOrderOpened';

  constructor(
    readonly serviceOrderId: string,
    readonly number: number,
    readonly customerId: string,
    readonly vehicleId: string,
    readonly occurredAt: Date,
  ) {}
}

export class QuoteGenerated implements DomainEvent {
  readonly eventName = 'QuoteGenerated';

  constructor(
    readonly serviceOrderId: string,
    readonly version: number,
    readonly total: Money,
    readonly occurredAt: Date,
  ) {}
}

export class QuoteApproved implements DomainEvent {
  readonly eventName = 'QuoteApproved';

  constructor(
    readonly serviceOrderId: string,
    readonly version: number,
    readonly occurredAt: Date,
  ) {}
}

export class QuoteRejected implements DomainEvent {
  readonly eventName = 'QuoteRejected';

  constructor(
    readonly serviceOrderId: string,
    readonly version: number,
    readonly reason: string | null,
    readonly partsToReverse: readonly PartToReverse[],
    readonly occurredAt: Date,
  ) {}
}

export class ServiceOrderFinished implements DomainEvent {
  readonly eventName = 'ServiceOrderFinished';

  constructor(
    readonly serviceOrderId: string,
    readonly occurredAt: Date,
  ) {}
}

export class ServiceOrderDelivered implements DomainEvent {
  readonly eventName = 'ServiceOrderDelivered';

  constructor(
    readonly serviceOrderId: string,
    readonly occurredAt: Date,
  ) {}
}
