import { Injectable } from '@nestjs/common';
import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

@Injectable()
export class GetServiceOrderUseCase {
  constructor(private readonly orders: ServiceOrderRepository) {}

  async execute(id: string): Promise<ServiceOrderOutput> {
    const order = await this.orders.findById(id);
    if (!order) throw new ServiceOrderNotFoundError();
    return toServiceOrderOutput(order);
  }
}
