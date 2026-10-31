import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { QuoteRejected } from '../domain/service-order.events.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { orderVisibleTo } from './order-visible-to.js';
import { PartStock } from './ports/part-stock.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface RejectQuoteInput {
  serviceOrderId: string;
  version: number;
  reason?: string | null;
  ownerId?: string;
}

@Injectable()
export class RejectQuoteUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly stock: PartStock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute({
    serviceOrderId,
    version,
    reason,
    ownerId,
  }: RejectQuoteInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = orderVisibleTo(
        await this.orders.findByIdForUpdate(serviceOrderId),
        ownerId,
      );

      order.reject(version, new Date(), reason);
      await this.orders.save(order);

      for (const event of order.pullDomainEvents()) {
        if (!(event instanceof QuoteRejected)) continue;
        for (const part of event.partsToReverse) {
          await this.stock.reverse(part.partId, part.quantity);
        }
      }
      return toServiceOrderOutput(order);
    });
  }
}
