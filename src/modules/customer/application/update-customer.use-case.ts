import { Injectable } from '@nestjs/common';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import type { CustomerDetails } from '../domain/customer.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { type CustomerOutput, toCustomerOutput } from './customer.output.js';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(id: string, details: CustomerDetails): Promise<CustomerOutput> {
    const customer = await this.customers.findById(id);
    if (!customer) {
      throw new CustomerNotFoundError();
    }

    customer.update(details);
    await this.customers.save(customer);
    return toCustomerOutput(customer);
  }
}
