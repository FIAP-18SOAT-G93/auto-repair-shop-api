import { Injectable } from '@nestjs/common';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { type CustomerOutput, toCustomerOutput } from './customer.output.js';

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(id: string): Promise<CustomerOutput> {
    const customer = await this.customers.findById(id);
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    return toCustomerOutput(customer);
  }
}
