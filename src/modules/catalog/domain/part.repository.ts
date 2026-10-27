import type { Quantity } from '../../../shared/domain/quantity.js';
import type { Part } from './part.js';

export interface PartFilter {
  onlyOutOfStock?: boolean;
}

export interface PartPage {
  items: Part[];
  total: number;
}

export abstract class PartRepository {
  abstract save(part: Part): Promise<void>;
  abstract findById(id: string): Promise<Part | null>;
  abstract list(
    filter: PartFilter,
    page: number,
    pageSize: number,
  ): Promise<PartPage>;
  abstract delete(id: string): Promise<void>;
  abstract deductStock(id: string, amount: Quantity): Promise<boolean>;
  abstract addStock(id: string, amount: Quantity): Promise<void>;
}
