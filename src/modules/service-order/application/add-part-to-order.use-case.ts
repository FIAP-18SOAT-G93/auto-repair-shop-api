import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { PartStock } from './ports/part-stock.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface AddPartToOrderInput {
  serviceOrderId: string;
  partId: string;
  quantity: number;
}

@Injectable()
export class AddPartToOrderUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly stock: PartStock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute({
    serviceOrderId,
    partId,
    quantity,
  }: AddPartToOrderInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const amount = Quantity.of(quantity);
      const order = await this.orders.findByIdForUpdate(serviceOrderId);
      if (!order) throw new ServiceOrderNotFoundError();
      order.assertAcceptsItems();

      const part = await this.stock.deduct(partId, amount);
      order.addPart({
        partId: part.id,
        name: part.name,
        unitPrice: part.unitPrice,
        quantity: amount,
      });
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }
}
