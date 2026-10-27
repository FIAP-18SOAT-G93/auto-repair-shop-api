import type { Service } from './service.js';

export interface ServicePage {
  items: Service[];
  total: number;
}

export abstract class ServiceRepository {
  abstract save(service: Service): Promise<void>;
  abstract findById(id: string): Promise<Service | null>;
  abstract list(page: number, pageSize: number): Promise<ServicePage>;
  abstract delete(id: string): Promise<void>;
}
