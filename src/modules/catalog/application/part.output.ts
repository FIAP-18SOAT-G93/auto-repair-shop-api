import type { PartType } from '../domain/part-type.js';
import type { Part } from '../domain/part.js';

export interface PartOutput {
  id: string;
  name: string;
  type: PartType;
  price: number;
  quantity: number;
}

export function toPartOutput(part: Part): PartOutput {
  return {
    id: part.id,
    name: part.name,
    type: part.type,
    price: part.price.toDecimal(),
    quantity: part.quantity.value,
  };
}
