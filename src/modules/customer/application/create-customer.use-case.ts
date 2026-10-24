import { Injectable } from '@nestjs/common';
import { DocumentAlreadyRegisteredError } from '../domain/customer.errors.js';
import { Customer } from '../domain/customer.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { Document } from '../domain/document.js';
import { type CustomerOutput, toCustomerOutput } from './customer.output.js';

export interface CreateCustomerInput {
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<CustomerOutput> {
    const document = Document.create(input.document);
    if (await this.customers.findByDocument(document)) {
      throw new DocumentAlreadyRegisteredError();
    }

    const customer = Customer.create({ ...input, document });
    await this.customers.save(customer);
    return toCustomerOutput(customer);
  }
}
