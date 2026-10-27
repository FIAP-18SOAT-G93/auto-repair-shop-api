import type { Quantity } from '../../../shared/domain/quantity.js';
import { PartNotFoundError } from '../domain/part.errors.js';
import { Part } from '../domain/part.js';
import {
  type PartFilter,
  type PartPage,
  PartRepository,
} from '../domain/part.repository.js';
import { ServiceNotFoundError } from '../domain/service.errors.js';
import { Service } from '../domain/service.js';
import {
  type ServicePage,
  ServiceRepository,
} from '../domain/service.repository.js';

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

export class InMemoryPartRepository implements PartRepository {
  readonly parts = new Map<string, Part>();

  async save(part: Part): Promise<void> {
    const stored = this.parts.get(part.id);
    this.parts.set(part.id, copyPart(part, stored?.quantity));
  }

  async findById(id: string): Promise<Part | null> {
    const part = this.parts.get(id);
    return part ? copyPart(part) : null;
  }

  async list(
    filter: PartFilter,
    page: number,
    pageSize: number,
  ): Promise<PartPage> {
    const matching = [...this.parts.values()]
      .filter((p) => !filter.onlyOutOfStock || p.isOutOfStock)
      .map((p) => copyPart(p));
    const start = (page - 1) * pageSize;
    return {
      items: matching.slice(start, start + pageSize),
      total: matching.length,
    };
  }

  async delete(id: string): Promise<void> {
    if (!this.parts.delete(id)) throw new PartNotFoundError();
  }

  async deductStock(id: string, amount: Quantity): Promise<boolean> {
    const stored = this.parts.get(id);
    if (!stored?.quantity.isGreaterThanOrEqual(amount)) return false;
    this.parts.set(id, copyPart(stored, stored.quantity.subtract(amount)));
    return true;
  }

  async addStock(id: string, amount: Quantity): Promise<void> {
    const stored = this.parts.get(id);
    if (!stored) throw new PartNotFoundError();
    this.parts.set(id, copyPart(stored, stored.quantity.add(amount)));
  }
}

function copyPart(part: Part, quantity = part.quantity): Part {
  return Part.restore(part.id, {
    name: part.name,
    type: part.type,
    price: part.price,
    quantity,
  });
}
