import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationGateway,
  type QuoteAvailableNotification,
  type ServiceOrderFinishedNotification,
} from '../../application/notification.gateway.js';

@Injectable()
export class LoggerNotificationGateway implements NotificationGateway {
  readonly #logger = new Logger(NotificationGateway.name);

  async quoteAvailable(
    notification: QuoteAvailableNotification,
  ): Promise<void> {
    const brl = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    this.#logger.log(
      `OS ${notification.serviceOrderId} em aprovação. Cliente ${notification.customerId} avisado sobre o orçamento de ${brl.format(notification.total.toDecimal())}.`,
    );
  }

  async serviceOrderFinished(
    notification: ServiceOrderFinishedNotification,
  ): Promise<void> {
    this.#logger.log(
      `OS ${notification.serviceOrderId} finalizada. Cliente ${notification.customerId} avisado para retirar o veículo.`,
    );
  }
}
