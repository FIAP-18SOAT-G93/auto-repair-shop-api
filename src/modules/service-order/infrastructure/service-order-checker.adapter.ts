import { Injectable } from '@nestjs/common';
import { ServiceOrderChecker } from '../../customer/application/service-order-checker.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';

@Injectable()
export class RepositoryServiceOrderChecker implements ServiceOrderChecker {
  constructor(private readonly orders: ServiceOrderRepository) {}

  customerHasOpenServiceOrders(customerId: string): Promise<boolean> {
    return this.orders.existsOpenForCustomer(customerId);
  }

  async vehicleHasOpenServiceOrders(vehicleId: string): Promise<boolean> {
    return (await this.orders.findOpenByVehicle(vehicleId)) !== null;
  }
}
