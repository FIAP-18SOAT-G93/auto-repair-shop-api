import { Injectable } from '@nestjs/common';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { Document } from '../domain/document.js';
import { type CustomerOutput, toCustomerOutput } from './customer.output.js';

@Injectable()
export class FindCustomerByDocumentUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(document: string): Promise<CustomerOutput> {
    const customer = await this.customers.findByDocument(
      Document.create(document),
    );
    if (!customer) {
      throw new CustomerNotFoundError();
    }
    return toCustomerOutput(customer);
  }
}
