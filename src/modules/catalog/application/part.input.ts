import { Money } from '../../../shared/domain/money.js';
import type { PartType } from '../domain/part-type.js';
import type { PartDetails } from '../domain/part.js';

export interface PartInput {
  name: string;
  type: PartType;
  price: number;
}

export function toPartDetails(input: PartInput): PartDetails {
  return {
    name: input.name,
    type: input.type,
    price: Money.fromDecimal(input.price),
  };
}

export interface StockMovementInput {
  partId: string;
  quantity: number;
}
