import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { orderVisibleTo } from './order-visible-to.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface ApproveQuoteInput {
  serviceOrderId: string;
  version: number;
  ownerId?: string;
}

@Injectable()
export class ApproveQuoteUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute({
    serviceOrderId,
    version,
    ownerId,
  }: ApproveQuoteInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = orderVisibleTo(
        await this.orders.findByIdForUpdate(serviceOrderId),
        ownerId,
      );

      order.approve(version, new Date());
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }
}
