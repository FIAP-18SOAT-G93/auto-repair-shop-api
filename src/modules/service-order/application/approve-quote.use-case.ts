import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface ApproveQuoteInput {
  serviceOrderId: string;
  version: number;
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
  }: ApproveQuoteInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();

      order.approve(version, new Date());
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }
}
