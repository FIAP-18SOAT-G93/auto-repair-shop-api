import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { QuoteRejected } from '../domain/service-order.events.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { PartStock } from './ports/part-stock.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface RejectQuoteInput {
  serviceOrderId: string;
  version: number;
  reason?: string | null;
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
  }: RejectQuoteInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();

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
