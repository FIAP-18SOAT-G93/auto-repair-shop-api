import type { Money } from '../../../../shared/domain/money.js';

export interface CatalogService {
  id: string;
  name: string;
  price: Money;
}

export abstract class ServiceCatalog {
  abstract getService(serviceId: string): Promise<CatalogService>;
}
