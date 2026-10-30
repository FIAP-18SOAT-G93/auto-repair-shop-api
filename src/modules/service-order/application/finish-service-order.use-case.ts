import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { ServiceOrderNotifier } from './service-order-notifier.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

@Injectable()
export class FinishServiceOrderUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly notifier: ServiceOrderNotifier,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(serviceOrderId: string): Promise<ServiceOrderOutput> {
    const { order, events } = await this.unitOfWork.run(async () => {
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();

      order.finish(new Date());
      await this.orders.save(order);
      return { order, events: order.pullDomainEvents() };
    });

    await this.notifier.notify(order.customerId, events);
    return toServiceOrderOutput(order);
  }
}
