import type { Money } from '../domain/money.js';

export interface QuoteAvailableNotification {
  customerId: string;
  serviceOrderId: string;
  total: Money;
}

export interface ServiceOrderFinishedNotification {
  customerId: string;
  serviceOrderId: string;
}

/** Avisa o cliente sobre fatos da OS. */
export abstract class NotificationGateway {
  abstract quoteAvailable(
    notification: QuoteAvailableNotification,
  ): Promise<void>;
  abstract serviceOrderFinished(
    notification: ServiceOrderFinishedNotification,
  ): Promise<void>;
}
