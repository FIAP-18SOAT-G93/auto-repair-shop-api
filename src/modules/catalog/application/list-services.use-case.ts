import { Injectable } from '@nestjs/common';
import { ServiceRepository } from '../domain/service.repository.js';
import { type ServiceOutput, toServiceOutput } from './service.output.js';

export interface ListServicesInput {
  page: number;
  pageSize: number;
}

export interface ListServicesOutput {
  items: ServiceOutput[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListServicesUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute({
    page,
    pageSize,
  }: ListServicesInput): Promise<ListServicesOutput> {
    const { items, total } = await this.services.list(page, pageSize);
    return { items: items.map(toServiceOutput), total, page, pageSize };
  }
}
