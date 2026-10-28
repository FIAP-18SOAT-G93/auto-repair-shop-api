import { Injectable } from '@nestjs/common';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PartNotFoundError } from '../domain/part.errors.js';
import { PartRepository } from '../domain/part.repository.js';
import type { StockMovementInput } from './part.input.js';
import { type PartOutput, toPartOutput } from './part.output.js';

@Injectable()
export class RegisterStockEntryUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute({ partId, quantity }: StockMovementInput): Promise<PartOutput> {
    const amount = Quantity.of(quantity);
    const part = await this.parts.findById(partId);
    if (!part) throw new PartNotFoundError();

    part.restock(amount);
    await this.parts.addStock(part.id, amount);

    const updated = await this.parts.findById(part.id);
    if (!updated) throw new PartNotFoundError();
    return toPartOutput(updated);
  }
}
