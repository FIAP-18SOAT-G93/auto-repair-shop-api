import { Injectable } from '@nestjs/common';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PartNotFoundError } from '../domain/part.errors.js';
import { PartRepository } from '../domain/part.repository.js';
import type { StockMovementInput } from './part.input.js';

@Injectable()
export class ReverseStockUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute({ partId, quantity }: StockMovementInput): Promise<void> {
    const amount = Quantity.of(quantity);
    const part = await this.parts.findById(partId);
    if (!part) throw new PartNotFoundError();

    part.reverse(amount);
    await this.parts.addStock(part.id, amount);
  }
}
