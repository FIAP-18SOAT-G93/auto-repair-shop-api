import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

@Injectable()
export class DeliverServiceOrderUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(serviceOrderId: string): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();

      order.deliver(new Date());
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }
}
