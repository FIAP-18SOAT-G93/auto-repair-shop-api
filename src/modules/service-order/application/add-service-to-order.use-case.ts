import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { ServiceCatalog } from './ports/service-catalog.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface AddServiceToOrderInput {
  serviceOrderId: string;
  serviceId: string;
}

@Injectable()
export class AddServiceToOrderUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly catalog: ServiceCatalog,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute({
    serviceOrderId,
    serviceId,
  }: AddServiceToOrderInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();
      order.assertAcceptsItems();

      const service = await this.catalog.getService(serviceId);
      order.addService({
        serviceId: service.id,
        name: service.name,
        price: service.price,
      });
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }
}
