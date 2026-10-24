import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../domain/customer.repository.js';
import { type CustomerOutput, toCustomerOutput } from './customer.output.js';

export interface ListCustomersInput {
  page: number;
  pageSize: number;
}

export interface ListCustomersOutput {
  items: CustomerOutput[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly customers: CustomerRepository) {}

  async execute({
    page,
    pageSize,
  }: ListCustomersInput): Promise<ListCustomersOutput> {
    const { items, total } = await this.customers.list(page, pageSize);
    return { items: items.map(toCustomerOutput), total, page, pageSize };
  }
}
