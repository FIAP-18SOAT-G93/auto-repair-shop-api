import { Injectable } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import { GetServiceUseCase } from '../../catalog/application/get-service.use-case.js';
import {
  type CatalogService,
  ServiceCatalog,
} from '../application/ports/service-catalog.js';

@Injectable()
export class CatalogModuleServiceCatalog implements ServiceCatalog {
  constructor(private readonly getServiceUseCase: GetServiceUseCase) {}

  async getService(serviceId: string): Promise<CatalogService> {
    const service = await this.getServiceUseCase.execute(serviceId);
    return {
      id: service.id,
      name: service.name,
      price: Money.fromDecimal(service.price),
    };
  }
}
