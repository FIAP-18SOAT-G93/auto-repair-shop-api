import { Money } from '../../../shared/domain/money.js';
import type { ServiceDetails } from '../domain/service.js';

export interface ServiceInput {
  name: string;
  description?: string | null;
  price: number;
  estimatedMinutes: number;
}

export function toServiceDetails(input: ServiceInput): ServiceDetails {
  return { ...input, price: Money.fromDecimal(input.price) };
}
