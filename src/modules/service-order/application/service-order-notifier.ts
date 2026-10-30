import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from '../../../shared/application/notification.gateway.js';
import type { DomainEvent } from '../../../shared/domain/domain-event.js';
import {
  QuoteGenerated,
  ServiceOrderFinished,
} from '../domain/service-order.events.js';

@Injectable()
export class ServiceOrderNotifier {
  readonly #logger = new Logger(ServiceOrderNotifier.name);

  constructor(private readonly gateway: NotificationGateway) {}

  async notify(
    customerId: string,
    events: readonly DomainEvent[],
  ): Promise<void> {
    for (const event of events) {
      try {
        await this.dispatch(customerId, event);
      } catch (error) {
        this.#logger.warn(
          `Falha ao notificar o cliente ${customerId} sobre ${event.eventName}: ${String(error)}`,
        );
      }
    }
  }

  private async dispatch(
    customerId: string,
    event: DomainEvent,
  ): Promise<void> {
    if (event instanceof QuoteGenerated) {
      await this.gateway.quoteAvailable({
        customerId,
        serviceOrderId: event.serviceOrderId,
        total: event.total,
      });
    }
    if (event instanceof ServiceOrderFinished) {
      await this.gateway.serviceOrderFinished({
        customerId,
        serviceOrderId: event.serviceOrderId,
      });
    }
  }
}
