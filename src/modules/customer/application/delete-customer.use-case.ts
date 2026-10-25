import { Injectable } from '@nestjs/common';
import {
  CustomerHasOpenServiceOrdersError,
  CustomerHasVehiclesError,
  CustomerNotFoundError,
} from '../domain/customer.errors.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { ServiceOrderChecker } from './service-order-checker.js';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly vehicles: VehicleRepository,
    private readonly serviceOrders: ServiceOrderChecker,
  ) {}

  async execute(id: string): Promise<void> {
    const customer = await this.customers.findById(id);
    if (!customer) throw new CustomerNotFoundError();

    if (await this.serviceOrders.customerHasOpenServiceOrders(customer.id)) {
      throw new CustomerHasOpenServiceOrdersError();
    }
    if (await this.vehicles.existsForCustomer(customer.id)) {
      throw new CustomerHasVehiclesError();
    }

    customer.delete(new Date());
    await this.customers.save(customer);
  }
}
