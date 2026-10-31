import { Injectable } from '@nestjs/common';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { orderVisibleTo } from './order-visible-to.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

@Injectable()
export class GetServiceOrderUseCase {
  constructor(private readonly orders: ServiceOrderRepository) {}

  async execute(id: string, ownerId?: string): Promise<ServiceOrderOutput> {
    const order = orderVisibleTo(await this.orders.findById(id), ownerId);
    return toServiceOrderOutput(order);
  }
}
