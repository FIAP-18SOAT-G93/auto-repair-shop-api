import type { Service } from '../domain/service.js';

export interface ServiceOutput {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedMinutes: number;
}

export function toServiceOutput(service: Service): ServiceOutput {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price.toDecimal(),
    estimatedMinutes: service.estimatedMinutes,
  };
}
