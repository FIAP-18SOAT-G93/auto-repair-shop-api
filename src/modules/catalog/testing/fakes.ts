import { ServiceNotFoundError } from '../domain/service.errors.js';
import { Service } from '../domain/service.js';
import {
  type ServicePage,
  ServiceRepository,
} from '../domain/service.repository.js';

/**
 * Guarda cópias, como um banco: alterar o agregado sem chamar save()
 * não muda o que está "gravado".
 */
export class InMemoryServiceRepository implements ServiceRepository {
  readonly services = new Map<string, Service>();

  async save(service: Service): Promise<void> {
    this.services.set(service.id, copy(service));
  }

  async findById(id: string): Promise<Service | null> {
    const service = this.services.get(id);
    return service ? copy(service) : null;
  }

  async list(page: number, pageSize: number): Promise<ServicePage> {
    const all = [...this.services.values()].map(copy);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
    };
  }

  async delete(id: string): Promise<void> {
    if (!this.services.delete(id)) throw new ServiceNotFoundError();
  }
}

function copy(service: Service): Service {
  return Service.restore(service.id, {
    name: service.name,
    description: service.description,
    price: service.price,
    estimatedMinutes: service.estimatedMinutes,
  });
}
