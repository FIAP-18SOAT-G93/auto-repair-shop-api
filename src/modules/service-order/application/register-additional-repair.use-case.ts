import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import type { NewPartItem, NewServiceItem } from '../domain/service-order.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { PartStock } from './ports/part-stock.js';
import { ServiceCatalog } from './ports/service-catalog.js';
import { ServiceOrderNotifier } from './service-order-notifier.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface RegisterAdditionalRepairInput {
  serviceOrderId: string;
  services?: readonly string[];
  parts?: readonly { partId: string; quantity: number }[];
}

@Injectable()
export class RegisterAdditionalRepairUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly catalog: ServiceCatalog,
    private readonly stock: PartStock,
    private readonly notifier: ServiceOrderNotifier,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: RegisterAdditionalRepairInput,
  ): Promise<ServiceOrderOutput> {
    const { order, events } = await this.unitOfWork.run(async () => {
      const requestedParts = (input.parts ?? []).map((part) => ({
        partId: part.partId,
        quantity: Quantity.of(part.quantity),
      }));
      const order = await this.orders.findByIdForUpdate(input.serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();
      order.assertAcceptsAdditionalRepair();

      const services: NewServiceItem[] = [];
      for (const serviceId of input.services ?? []) {
        const service = await this.catalog.getService(serviceId);
        services.push({
          serviceId: service.id,
          name: service.name,
          price: service.price,
        });
      }
      const parts: NewPartItem[] = [];
      for (const { partId, quantity } of requestedParts) {
        const part = await this.stock.deduct(partId, quantity);
        parts.push({
          partId: part.id,
          name: part.name,
          unitPrice: part.unitPrice,
          quantity,
        });
      }

      order.registerAdditionalRepair({ services, parts }, new Date());
      await this.orders.save(order);
      return { order, events: order.pullDomainEvents() };
    });

    await this.notifier.notify(order.customerId, events);
    return toServiceOrderOutput(order);
  }
}
